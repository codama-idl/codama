/* eslint-disable no-case-declarations */
import {
    CODAMA_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE,
    CODAMA_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES,
    CODAMA_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY,
    CodamaError,
} from '@codama/errors';
import {
    AccountValueNode,
    accountValueNode,
    ArgumentValueNode,
    argumentValueNode,
    CamelCaseString,
    getAllInstructionArguments,
    InstructionAccountNode,
    InstructionArgumentNode,
    InstructionInputValueNode,
    InstructionNode,
    isNode,
    VALUE_NODES,
} from '@codama/nodes';

import { singleNodeVisitor } from './singleNodeVisitor';
import { Visitor } from './visitor';

export type ResolvedInstructionInput = ResolvedInstructionAccount | ResolvedInstructionArgument;
export type ResolvedInstructionAccount = InstructionAccountNode & {
    dependsOn: InstructionDependency[];
    isPda: boolean;
    resolvedIsOptional: boolean;
    resolvedIsSigner: boolean | 'either';
};
export type ResolvedInstructionArgument = InstructionArgumentNode & {
    dependsOn: InstructionDependency[];
};
type InstructionInput = InstructionAccountNode | InstructionArgumentNode;
type InstructionDependency = AccountValueNode | ArgumentValueNode;

export function getResolvedInstructionInputsVisitor(
    options: { includeDataArgumentValueNodes?: boolean } = {},
): Visitor<ResolvedInstructionInput[], 'instructionNode'> {
    const includeDataArgumentValueNodes = options.includeDataArgumentValueNodes ?? false;
    let stack: InstructionInput[] = [];
    let resolved: ResolvedInstructionInput[] = [];
    let visitedAccounts = new Map<string, ResolvedInstructionAccount>();
    let visitedArgs = new Map<string, ResolvedInstructionArgument>();

    function resolveInstructionInput(instruction: InstructionNode, input: InstructionInput): void {
        // Ensure we don't visit the same input twice.
        if (
            (isNode(input, 'instructionAccountNode') && visitedAccounts.has(input.name)) ||
            (isNode(input, 'instructionArgumentNode') && visitedArgs.has(input.name))
        ) {
            return;
        }

        // Ensure we don't have a circular dependency.
        const isCircular = stack.some(({ kind, name }) => kind === input.kind && name === input.name);
        if (isCircular) {
            const cycle = [...stack, input];
            throw new CodamaError(
                CODAMA_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES,
                {
                    cycle,
                    formattedCycle: cycle.map(({ name }) => name).join(' -> '),
                    instruction,
                    instructionName: instruction.name,
                },
            );
        }

        // Resolve whilst keeping track of the stack.
        stack.push(input);
        const localResolved =
            input.kind === 'instructionAccountNode'
                ? resolveInstructionAccount(instruction, input)
                : resolveInstructionArgument(instruction, input);
        stack.pop();

        // Store the resolved input.
        resolved.push(localResolved);
        if (localResolved.kind === 'instructionAccountNode') {
            visitedAccounts.set(input.name, localResolved);
        } else {
            visitedArgs.set(input.name, localResolved);
        }
    }

    function resolveInstructionAccount(
        instruction: InstructionNode,
        account: InstructionAccountNode,
    ): ResolvedInstructionAccount {
        // Find and visit dependencies first.
        const dependsOn = getInstructionDependencies(account);
        resolveInstructionDependencies(instruction, account, dependsOn);

        const localResolved: ResolvedInstructionAccount = {
            ...account,
            dependsOn,
            isPda: getAllInstructionArguments(instruction).some(
                argument =>
                    isNode(argument.defaultValue, 'accountBumpValueNode') &&
                    argument.defaultValue.name === account.name,
            ),
            resolvedIsOptional: !!account.isOptional,
            resolvedIsSigner: account.isSigner,
        };

        switch (localResolved.defaultValue?.kind) {
            case 'accountValueNode':
                const defaultAccount = visitedAccounts.get(localResolved.defaultValue.name)!;
                const resolvedIsPublicKey = account.isSigner === false && defaultAccount.isSigner === false;
                const resolvedIsSigner = account.isSigner === true && defaultAccount.isSigner === true;
                const resolvedIsOptionalSigner = !resolvedIsPublicKey && !resolvedIsSigner;
                localResolved.resolvedIsSigner = resolvedIsOptionalSigner ? 'either' : resolvedIsSigner;
                localResolved.resolvedIsOptional = !!defaultAccount.isOptional;
                break;
            case 'publicKeyValueNode':
            case 'programLinkNode':
            case 'programIdValueNode':
                localResolved.resolvedIsSigner = account.isSigner === false ? false : 'either';
                localResolved.resolvedIsOptional = false;
                break;
            case 'pdaValueNode':
                localResolved.resolvedIsSigner = account.isSigner === false ? false : 'either';
                localResolved.resolvedIsOptional = false;
                const { seeds } = localResolved.defaultValue;
                seeds.forEach(seed => {
                    if (!isNode(seed.value, 'accountValueNode')) return;
                    const dependency = visitedAccounts.get(seed.value.name)!;
                    if (dependency.resolvedIsOptional) {
                        throw new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE, {
                            instruction: instruction,
                            instructionAccount: account,
                            instructionAccountName: account.name,
                            instructionName: instruction.name,
                            seed,
                            seedName: seed.name,
                            seedValueName: seed.value.name,
                        });
                    }
                });
                break;
            case 'identityValueNode':
            case 'payerValueNode':
            case 'resolverValueNode':
                localResolved.resolvedIsOptional = false;
                break;
            default:
                break;
        }

        return localResolved;
    }

    function resolveInstructionArgument(
        instruction: InstructionNode,
        argument: InstructionArgumentNode,
    ): ResolvedInstructionArgument {
        // Find and visit dependencies first.
        const dependsOn = getInstructionDependencies(argument);
        resolveInstructionDependencies(instruction, argument, dependsOn);

        return { ...argument, dependsOn };
    }

    function resolveInstructionDependencies(
        instruction: InstructionNode,
        parent: InstructionInput,
        dependencies: InstructionDependency[],
    ): void {
        dependencies.forEach(dependency => {
            let input: InstructionInput | null = null;
            if (isNode(dependency, 'accountValueNode')) {
                const dependencyAccount = instruction.accounts.find(a => a.name === dependency.name);
                if (!dependencyAccount) {
                    throw new CodamaError(CODAMA_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY, {
                        dependency,
                        dependencyKind: dependency.kind,
                        dependencyName: dependency.name,
                        instruction,
                        instructionName: instruction.name,
                        parent,
                        parentKind: parent.kind,
                        parentName: parent.name,
                    });
                }
                input = { ...dependencyAccount };
            } else if (isNode(dependency, 'argumentValueNode')) {
                const dependencyArgument = getAllInstructionArguments(instruction).find(
                    a => a.name === dependency.name,
                );
                if (!dependencyArgument) {
                    throw new CodamaError(CODAMA_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY, {
                        dependency,
                        dependencyKind: dependency.kind,
                        dependencyName: dependency.name,
                        instruction,
                        instructionName: instruction.name,
                        parent,
                        parentKind: parent.kind,
                        parentName: parent.name,
                    });
                }
                input = { ...dependencyArgument };
            }
            if (input) {
                resolveInstructionInput(instruction, input);
            }
        });
    }

    return singleNodeVisitor('instructionNode', (node): ResolvedInstructionInput[] => {
        // Ensure we always start with a clean slate.
        stack = [];
        resolved = [];
        visitedAccounts = new Map();
        visitedArgs = new Map();

        const inputs: InstructionInput[] = [
            ...node.accounts,
            ...node.arguments.filter(a => {
                if (includeDataArgumentValueNodes) return a.defaultValue;
                return a.defaultValue && !isNode(a.defaultValue, VALUE_NODES);
            }),
            ...(node.extraArguments ?? []).filter(a => a.defaultValue),
        ];

        // Visit all instruction accounts.
        inputs.forEach(input => {
            resolveInstructionInput(node, input);
        });

        return resolved;
    });
}

export function deduplicateInstructionDependencies(dependencies: InstructionDependency[]): InstructionDependency[] {
    const accounts = new Map<CamelCaseString, InstructionDependency>();
    const args = new Map<CamelCaseString, InstructionDependency>();
    dependencies.forEach(dependency => {
        if (isNode(dependency, 'accountValueNode')) {
            accounts.set(dependency.name, dependency);
        } else if (isNode(dependency, 'argumentValueNode')) {
            args.set(dependency.name, dependency);
        }
    });
    return [...accounts.values(), ...args.values()];
}

export function getInstructionDependencies(input: InstructionInput | InstructionNode): InstructionDependency[] {
    if (isNode(input, 'instructionNode')) {
        return deduplicateInstructionDependencies([
            ...input.accounts.flatMap(getInstructionDependencies),
            ...input.arguments.flatMap(getInstructionDependencies),
            ...(input.extraArguments ?? []).flatMap(getInstructionDependencies),
        ]);
    }

    if (!input.defaultValue) return [];

    const getNestedDependencies = (defaultValue: InstructionInputValueNode | undefined): InstructionDependency[] => {
        if (!defaultValue) return [];
        return getInstructionDependencies({ ...input, defaultValue });
    };

    if (isNode(input.defaultValue, ['accountValueNode', 'accountBumpValueNode'])) {
        return [accountValueNode(input.defaultValue.name)];
    }

    if (isNode(input.defaultValue, ['argumentValueNode'])) {
        return [argumentValueNode(input.defaultValue.name)];
    }

    if (isNode(input.defaultValue, 'pdaValueNode')) {
        const dependencies = new Map<CamelCaseString, InstructionDependency>();
        input.defaultValue.seeds.forEach(seed => {
            if (isNode(seed.value, ['accountValueNode', 'argumentValueNode'])) {
                dependencies.set(seed.value.name, { ...seed.value });
            }
        });
        return <InstructionDependency[]>[
            ...dependencies.values(),
            ...(input.defaultValue.programId ? ([input.defaultValue.programId] as const) : []),
        ];
    }

    if (isNode(input.defaultValue, 'resolverValueNode')) {
        return input.defaultValue.dependsOn ?? [];
    }

    if (isNode(input.defaultValue, 'conditionalValueNode')) {
        return deduplicateInstructionDependencies([
            ...getNestedDependencies(input.defaultValue.condition),
            ...getNestedDependencies(input.defaultValue.ifTrue),
            ...getNestedDependencies(input.defaultValue.ifFalse),
        ]);
    }

    return [];
}
