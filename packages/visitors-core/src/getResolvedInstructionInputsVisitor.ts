import {
    CODAMA_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE,
    CODAMA_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES,
    CODAMA_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY,
    CodamaError,
} from '@codama/errors';
import {
    AccountValueNode,
    accountValueNode,
    DataValueNode,
    dataValueNode,
    IdentifierString,
    InstructionAccountNode,
    InstructionInputValueNode,
    INSTRUCTION_INPUT_VALUE_NODES,
    InstructionNode,
    isNode,
    PathString,
    PdaSeedValueNode,
    StructFieldTypeNode,
    VALUE_NODES,
} from '@codama/nodes';

import { LinkableDictionary } from './LinkableDictionary';
import { getLastNodeFromPath } from './NodePath';
import { NodeStack } from './NodeStack';
import { pipe } from './pipe';
import { ProvidedScope } from './ProvidedScope';
import { recordNodeStackVisitor } from './recordNodeStackVisitor';
import { recordProvidedScopeVisitor } from './recordProvidedScopeVisitor';
import { singleNodeVisitor } from './singleNodeVisitor';
import { Visitor } from './visitor';

/** A resolved account or data-field input, discriminated by `node.kind`. */
export type ResolvedInstructionInput = ResolvedInstructionAccount | ResolvedInstructionDataField;

export type ResolvedInstructionAccount = {
    dependsOn: InstructionDependency[];
    isPda: boolean;
    node: InstructionAccountNode;
    /** The input's default value after resolving any `injectedValueNode` through the {@link ProvidedScope}. */
    resolvedDefaultValue?: InstructionInputValueNode;
    resolvedIsOptional: boolean;
    resolvedIsSigner: boolean | 'either';
};

export type ResolvedInstructionDataField = {
    dependsOn: InstructionDependency[];
    node: StructFieldTypeNode;
    /** The field's full path within `instructionNode.data`, e.g. `config.bump`. */
    path: PathString;
    resolvedDefaultValue?: InstructionInputValueNode;
};

export type InstructionDependency = AccountValueNode | DataValueNode;

/** An input in the dependency graph — an account, or a data field addressed by its path. */
type InstructionInput = AccountInput | DataInput;
type AccountInput = { key: IdentifierString; kind: 'account'; node: InstructionAccountNode };
type DataInput = { key: PathString; kind: 'data'; node: StructFieldTypeNode };

/**
 * Resolve the default values of an instruction's accounts and data fields,
 * returning them in dependency order.
 *
 * @param linkables - Used to follow a `definedTypeLinkNode` in the instruction's `data`.
 * @param options.stack - The ancestry of the visited instruction. It must contain the
 *   instruction's `programNode` for `definedTypeLinkNode` data to be followed; otherwise a
 *   linked `data` type contributes no fields.
 * @param options.scope - The providers enclosing the visited instruction (e.g. its parent
 *   instructions). The instruction's own `provides` are added on top for the visit.
 * @param options.includeDataValueNodes - Whether to include data fields whose resolved
 *   default is a static value.
 */
export function getResolvedInstructionInputsVisitor(
    linkables: LinkableDictionary,
    options: { includeDataValueNodes?: boolean; scope?: ProvidedScope; stack?: NodeStack } = {},
): Visitor<ResolvedInstructionInput[], 'instructionNode'> {
    const includeDataValueNodes = options.includeDataValueNodes ?? false;
    const stack = options.stack ?? new NodeStack();
    const scope = options.scope ?? new ProvidedScope();

    // Per-visit state, reset at the start of every `instructionNode` visit.
    let dfsStack: InstructionInput[] = [];
    let resolved: ResolvedInstructionInput[] = [];
    let visitedAccounts = new Map<IdentifierString, ResolvedInstructionAccount>();
    let visitedData = new Map<PathString, ResolvedInstructionDataField>();
    let dataFields: DataInput[] = [];
    let dataDefaults = new Map<PathString, InstructionInputValueNode | undefined>();
    let bumpAccounts = new Set<IdentifierString>();

    // Resolves every injection within the default value, including nested
    // ones (e.g. a PDA seed). A missing provider is not an error: a reusable
    // data shape may offer an optional hook that this instruction does not fill.
    function resolveDefaultValue(
        defaultValue: InstructionInputValueNode | undefined,
    ): InstructionInputValueNode | undefined {
        if (defaultValue === undefined) return undefined;
        return scope.resolve(defaultValue, { kinds: INSTRUCTION_INPUT_VALUE_NODES });
    }

    // Walk `instructionNode.data`, following defined-type links, and yield
    // every struct field with its full path. Fields are only addressable
    // where the data type resolves to a struct.
    function collectDataFields(instruction: InstructionNode): DataInput[] {
        const fields: DataInput[] = [];
        const walkedDefinedTypes = new Set<string>();

        const walk = (type: InstructionNode['data'], prefix: string): void => {
            if (!type) return;
            if (isNode(type, 'definedTypeLinkNode')) {
                const linkedPath = linkables.getPath([...stack.getPath(), type]);
                if (!linkedPath) return;
                const definedType = getLastNodeFromPath(linkedPath);
                if (walkedDefinedTypes.has(definedType.identifier)) return;
                walkedDefinedTypes.add(definedType.identifier);
                stack.pushPath(linkedPath);
                walk(definedType.type, prefix);
                stack.popPath();
                return;
            }
            if (!isNode(type, 'structTypeNode')) return;
            (type.fields ?? []).forEach(field => {
                const path = (prefix ? `${prefix}.${field.identifier}` : field.identifier) as PathString;
                fields.push({ key: path, kind: 'data', node: field });
                if (isNode(field.type, 'structTypeNode') || isNode(field.type, 'definedTypeLinkNode')) {
                    walk(field.type, path);
                }
            });
        };

        walk(instruction.data, '');
        return fields;
    }

    function resolveInstructionInput(instruction: InstructionNode, input: InstructionInput): void {
        // Ensure we don't visit the same input twice.
        if (input.kind === 'account' ? visitedAccounts.has(input.key) : visitedData.has(input.key)) {
            return;
        }

        // Ensure we don't have a circular dependency.
        const isCircular = dfsStack.some(entry => entry.kind === input.kind && entry.key === input.key);
        if (isCircular) {
            const cycle = [...dfsStack, input];
            throw new CodamaError(
                CODAMA_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES,
                {
                    cycle: cycle.map(entry => entry.node),
                    formattedCycle: cycle.map(entry => entry.key).join(' -> '),
                    instruction,
                    instructionName: instruction.identifier,
                },
            );
        }

        // Resolve whilst keeping track of the stack.
        dfsStack.push(input);
        const localResolved =
            input.kind === 'account'
                ? resolveInstructionAccount(instruction, input)
                : resolveInstructionDataField(instruction, input);
        dfsStack.pop();

        // Store the resolved input.
        resolved.push(localResolved);
        if (localResolved.node.kind === 'instructionAccountNode') {
            visitedAccounts.set(input.key as IdentifierString, localResolved as ResolvedInstructionAccount);
        } else {
            visitedData.set(input.key as PathString, localResolved as ResolvedInstructionDataField);
        }
    }

    function resolveInstructionAccount(instruction: InstructionNode, input: AccountInput): ResolvedInstructionAccount {
        const account = input.node;
        const resolvedDefaultValue = resolveDefaultValue(account.defaultValue);

        // Find and visit dependencies first.
        const dependsOn = getDependencies(resolvedDefaultValue);
        resolveDependencies(instruction, input, dependsOn);

        const localResolved: ResolvedInstructionAccount = {
            dependsOn,
            isPda: bumpAccounts.has(account.identifier),
            node: account,
            ...(resolvedDefaultValue !== undefined && { resolvedDefaultValue }),
            resolvedIsOptional: !!account.isOptional,
            resolvedIsSigner: account.isSigner,
        };

        switch (resolvedDefaultValue?.kind) {
            case 'accountValueNode': {
                const defaultAccount = visitedAccounts.get(resolvedDefaultValue.identifier)!;
                const resolvedIsPublicKey = account.isSigner === false && defaultAccount.node.isSigner === false;
                const resolvedIsSigner = account.isSigner === true && defaultAccount.node.isSigner === true;
                const resolvedIsOptionalSigner = !resolvedIsPublicKey && !resolvedIsSigner;
                localResolved.resolvedIsSigner = resolvedIsOptionalSigner ? 'either' : resolvedIsSigner;
                localResolved.resolvedIsOptional = !!defaultAccount.node.isOptional;
                break;
            }
            case 'publicKeyValueNode':
            case 'programLinkNode':
            case 'programIdValueNode':
                localResolved.resolvedIsSigner = account.isSigner === false ? false : 'either';
                localResolved.resolvedIsOptional = false;
                break;
            case 'pdaValueNode': {
                localResolved.resolvedIsSigner = account.isSigner === false ? false : 'either';
                localResolved.resolvedIsOptional = false;
                (resolvedDefaultValue.seeds ?? []).forEach(seed => {
                    if (!isNode(seed.value, 'accountValueNode')) return;
                    const dependency = visitedAccounts.get(seed.value.identifier)!;
                    if (dependency.resolvedIsOptional) {
                        throw new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE, {
                            instruction,
                            instructionAccount: account,
                            instructionAccountName: account.identifier,
                            instructionName: instruction.identifier,
                            // The guard above narrows `seed.value`, which TS does not propagate to `seed` itself.
                            seed: seed as PdaSeedValueNode<AccountValueNode>,
                            seedName: seed.identifier,
                            seedValueName: seed.value.identifier,
                        });
                    }
                });
                break;
            }
            case 'identityValueNode':
            case 'payerValueNode':
                localResolved.resolvedIsOptional = false;
                break;
            default:
                break;
        }

        return localResolved;
    }

    function resolveInstructionDataField(instruction: InstructionNode, input: DataInput): ResolvedInstructionDataField {
        const resolvedDefaultValue = dataDefaults.get(input.key);
        const dependsOn = getDependencies(resolvedDefaultValue);
        resolveDependencies(instruction, input, dependsOn);
        return {
            dependsOn,
            node: input.node,
            path: input.key,
            ...(resolvedDefaultValue !== undefined && { resolvedDefaultValue }),
        };
    }

    function resolveDependencies(
        instruction: InstructionNode,
        parent: InstructionInput,
        dependencies: InstructionDependency[],
    ): void {
        dependencies.forEach(dependency => {
            let input: InstructionInput | null = null;
            if (isNode(dependency, 'accountValueNode')) {
                const dependencyAccount = (instruction.accounts ?? []).find(
                    a => a.identifier === dependency.identifier,
                );
                if (!dependencyAccount) {
                    throwInvalidDependency(instruction, parent, dependency, dependency.identifier);
                }
                input = { key: dependencyAccount.identifier, kind: 'account', node: dependencyAccount };
            } else if (isNode(dependency, 'dataValueNode')) {
                const dependencyField = findFieldByPath(dataFields, dependency.path);
                if (!dependencyField) {
                    throwInvalidDependency(instruction, parent, dependency, dependency.path);
                }
                input = dependencyField;
            }
            if (input) {
                resolveInstructionInput(instruction, input);
            }
        });
    }

    function throwInvalidDependency(
        instruction: InstructionNode,
        parent: InstructionInput,
        dependency: InstructionDependency,
        dependencyName: IdentifierString | PathString,
    ): never {
        throw new CodamaError(CODAMA_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY, {
            dependency,
            dependencyKind: dependency.kind,
            dependencyName,
            instruction,
            instructionName: instruction.identifier,
            parent: parent.node,
            parentKind: parent.node.kind,
            parentName: parent.key,
        });
    }

    const visitor = singleNodeVisitor('instructionNode', (node): ResolvedInstructionInput[] => {
        // Ensure we always start with a clean slate.
        dfsStack = [];
        resolved = [];
        visitedAccounts = new Map();
        visitedData = new Map();

        // The data fields and their resolved defaults are fixed for the
        // duration of the visit, so compute them once.
        dataFields = collectDataFields(node);
        dataDefaults = new Map(
            dataFields.map(field => [field.key, resolveDefaultValue(asInstructionInputValue(field.node.defaultValue))]),
        );
        bumpAccounts = new Set(
            [...dataDefaults.values()].flatMap(value =>
                isNode(value, 'accountBumpValueNode') ? [value.identifier] : [],
            ),
        );

        const dataInputs = dataFields.filter(field => {
            const value = dataDefaults.get(field.key);
            if (!value) return false;
            // Skip static value defaults unless explicitly requested — there's
            // nothing to resolve for a plain literal.
            return includeDataValueNodes || !isNode(value, VALUE_NODES);
        });

        const inputs: InstructionInput[] = [
            ...(node.accounts ?? []).map(account => ({
                key: account.identifier,
                kind: 'account' as const,
                node: account,
            })),
            ...dataInputs,
        ];

        inputs.forEach(input => resolveInstructionInput(node, input));

        return resolved;
    });

    return pipe(
        visitor,
        // Opens the visited instruction's own `provides` frame on top of any
        // frames the caller's scope already holds (e.g. parent instructions).
        v => recordProvidedScopeVisitor(v, scope),
        v => recordNodeStackVisitor(v, stack),
    );
}

/**
 * Match a `dataValueNode` path to a data field. A path deeper than the
 * struct-field graph (e.g. into an array element like `config.fees[0]`)
 * resolves to the longest field-path prefix that exists — the field that
 * holds the referenced element.
 */
function findFieldByPath(fields: DataInput[], path: PathString): DataInput | undefined {
    return fields
        .filter(f => path === f.key || path.startsWith(`${f.key}.`) || path.startsWith(`${f.key}[`))
        .sort((a, b) => b.key.length - a.key.length)[0];
}

/**
 * A `structFieldTypeNode.defaultValue` is a `ValueNode`, a strict subset of
 * `InstructionInputValueNode`. This narrows it for the shared resolution
 * helpers.
 */
function asInstructionInputValue(
    value: InstructionInputValueNode | StructFieldTypeNode['defaultValue'],
): InstructionInputValueNode | undefined {
    return value as InstructionInputValueNode | undefined;
}

export function deduplicateInstructionDependencies(dependencies: InstructionDependency[]): InstructionDependency[] {
    const accounts = new Map<IdentifierString, InstructionDependency>();
    const data = new Map<PathString, InstructionDependency>();
    dependencies.forEach(dependency => {
        if (isNode(dependency, 'accountValueNode')) {
            accounts.set(dependency.identifier, dependency);
        } else if (isNode(dependency, 'dataValueNode')) {
            data.set(dependency.path, dependency);
        }
    });
    return [...accounts.values(), ...data.values()];
}

/** The account/data references a default value depends on, resolved recursively. */
export function getDependencies(defaultValue: InstructionInputValueNode | undefined): InstructionDependency[] {
    if (!defaultValue) return [];

    if (isNode(defaultValue, ['accountValueNode', 'accountBumpValueNode'])) {
        return [accountValueNode(defaultValue.identifier)];
    }

    if (isNode(defaultValue, 'accountDataValueNode')) {
        return [accountValueNode(defaultValue.account)];
    }

    if (isNode(defaultValue, 'dataValueNode')) {
        return [dataValueNode(defaultValue.path)];
    }

    if (isNode(defaultValue, 'pdaValueNode')) {
        const dependencies: InstructionDependency[] = [];
        (defaultValue.seeds ?? []).forEach(seed => {
            if (isNode(seed.value, 'accountValueNode') || isNode(seed.value, 'dataValueNode')) {
                dependencies.push({ ...seed.value });
            }
        });
        return deduplicateInstructionDependencies([
            ...dependencies,
            ...(defaultValue.programId && isNode(defaultValue.programId, 'accountValueNode')
                ? [defaultValue.programId]
                : []),
        ]);
    }

    if (isNode(defaultValue, 'conditionalValueNode')) {
        return deduplicateInstructionDependencies([
            ...getDependencies(defaultValue.condition),
            ...getDependencies(defaultValue.ifTrue),
            ...getDependencies(defaultValue.ifFalse),
        ]);
    }

    return [];
}
