import {
    CODAMA_ERROR__CANNOT_UPGRADE_CONFLICTING_PROVIDED_KEY,
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CodamaError,
} from '@codama/errors';
import type { Node } from '@codama/node-types';

import type * as v1 from '../v1';
import type * as v2 from '../v2';
import {
    getV1InjectionPaths,
    instructionInputValueNodeFromV1,
    isV1ContextualInputValueNode,
    isV1InputValueRepresentable,
    isV1InstructionInputValueNode,
    resolverPluginNodeFromV1,
} from './contextualValueNodes';
import { pluginNodeFromV1 } from './definitionNodes';
import { discriminatorNodeFromV1 } from './discriminatorNodes';
import { displayNodeFromV1 } from './displayNodes';
import { linkNodeFromV1 } from './linkNodes';
import { getLastV1NodeFromPath, V1NodePath } from './paths';
import { compactAndFreeze, docsFromV1, identifierFromV1, integerStringFromV1, pathFromV1 } from './shared';
import { typeNodeFromV1 } from './typeNodes';
import { valueNodeFromV1 } from './valueNodes';

/**
 * Convert a v1 instruction.
 *
 * - Arguments become the fields of a struct `data`, and contextual argument
 *   defaults become `provides` entries injected by key, keyed by the argument.
 * - Extra arguments become `codama.extraArgument` plugins, with nested
 *   `codama.resolver` plugins for defaults v2 cannot express.
 * - Defaults v2 cannot express — resolvers, and inputs relying on a resolver
 *   or an extra argument — become `codama.resolver` plugins on their node.
 *   Resolved fields keep their default value strategy.
 * - Remaining accounts are identified by their argument, or as
 *   `remainingAccounts` when resolved.
 *
 * @throws `CODAMA_ERROR__CANNOT_UPGRADE_CONFLICTING_PROVIDED_KEY` when two
 * different values would be provided under the same key, e.g. a v1 provided
 * node and an argument default, or when providing an argument default would
 * change what a v1 injection of the same key resolves to.
 */
export function instructionNodeFromV1(path: V1NodePath<v1.InstructionNode>): v2.InstructionNode {
    const instruction = getLastV1NodeFromPath(path);
    const extraArguments = getV1ExtraArgumentNames(instruction);
    const argumentPaths = (instruction.arguments ?? []).map(argument => [...path, argument] as const);
    const fields = argumentPaths.map(argumentPath => instructionArgumentFromV1(argumentPath, extraArguments));
    const providedByArguments = fields.flatMap(({ provided }, index) =>
        provided ? [{ node: provided, path: argumentPaths[index] }] : [],
    );
    const provides = mergeProvidedNodes([
        ...(instruction.provides ?? []).map(provided => ({
            node: providedNodeFromV1([...path, provided]),
            path: [...path, provided],
        })),
        ...providedByArguments,
    ]);
    assertNoCapturedV1Injections(path, providedByArguments);
    const extraArgumentPlugins = (instruction.extraArguments ?? []).map(argument =>
        extraArgumentPluginNodeFromV1([...path, argument], extraArguments),
    );

    return compactAndFreeze({
        kind: 'instructionNode',
        identifier: identifierFromV1(instruction.name),
        optionalAccountStrategy: instruction.optionalAccountStrategy,
        docs: docsFromV1(instruction.docs),
        accounts: instruction.accounts?.map(account =>
            instructionAccountNodeFromV1([...path, account], extraArguments),
        ),
        data:
            fields.length > 0
                ? compactAndFreeze<v2.StructTypeNode>({
                      kind: 'structTypeNode',
                      fields: fields.map(({ field }) => field),
                  })
                : undefined,
        remainingAccounts: instructionRemainingAccountsNodesFromV1(path),
        byteDeltas: instruction.byteDeltas?.map((byteDelta, index) =>
            instructionByteDeltaNodeFromV1([...path, byteDelta], extraArguments, index),
        ),
        discriminators: instruction.discriminators?.map(discriminator =>
            discriminatorNodeFromV1([...path, discriminator]),
        ),
        status: instruction.status ? instructionStatusNodeFromV1(instruction.status) : undefined,
        subInstructions: instruction.subInstructions?.map(subInstruction =>
            instructionNodeFromV1([...path, subInstruction]),
        ),
        provides,
        display: instruction.display ? displayNodeFromV1(instruction.display) : undefined,
        plugins: [...(instruction.plugins ?? []).map(pluginNodeFromV1), ...extraArgumentPlugins],
    });
}

/**
 * Convert a v1 instruction argument into a struct field of the instruction
 * data, together with the entry providing its contextual default, if any.
 */
function instructionArgumentFromV1(
    path: V1NodePath<v1.InstructionArgumentNode>,
    extraArguments: ReadonlySet<string>,
): { field: v2.StructFieldTypeNode; provided?: v2.ProvidedNode } {
    const argument = getLastV1NodeFromPath(path);
    const identifier = identifierFromV1(argument.name);
    const defaultValue = argument.defaultValue;

    let fieldDefault: v2.ValueNode | undefined;
    let provided: v2.ProvidedNode | undefined;
    let resolver: v2.PluginNode | undefined;
    if (defaultValue && !isV1InputValueRepresentable(defaultValue, extraArguments)) {
        resolver = resolverPluginNodeFromV1(defaultValue, argument.name, path);
    } else if (defaultValue && hasV1ProvidedDefault(argument, extraArguments)) {
        fieldDefault = compactAndFreeze<v2.InjectedValueNode>({ kind: 'injectedValueNode', key: identifier });
        provided = compactAndFreeze<v2.ProvidedNode>({
            kind: 'providedNode',
            identifier,
            node: instructionInputValueNodeFromV1([...path, defaultValue], [...path, argument.type]),
        });
    } else if (defaultValue) {
        fieldDefault = valueNodeFromV1([...path, defaultValue as v1.ValueNode], [...path, argument.type]);
    }

    const field = compactAndFreeze<v2.StructFieldTypeNode>({
        kind: 'structFieldTypeNode',
        identifier,
        defaultValueStrategy: fieldDefault || resolver ? argument.defaultValueStrategy : undefined,
        docs: docsFromV1(argument.docs),
        type: typeNodeFromV1([...path, argument.type]),
        defaultValue: fieldDefault,
        display: argument.display ? displayNodeFromV1(argument.display) : undefined,
        plugins: resolver ? [resolver] : undefined,
    });
    return { field, provided };
}

function getV1ExtraArgumentNames(instruction: v1.InstructionNode): ReadonlySet<string> {
    return new Set((instruction.extraArguments ?? []).map(argument => argument.name));
}

/** Whether the default of a v1 argument is provided under the name of the argument, i.e. it is contextual and v2 can express it. */
function hasV1ProvidedDefault(argument: v1.InstructionArgumentNode, extraArguments: ReadonlySet<string>): boolean {
    const defaultValue = argument.defaultValue;
    return (
        !!defaultValue &&
        isV1InputValueRepresentable(defaultValue, extraArguments) &&
        isV1ContextualInputValueNode(defaultValue)
    );
}

/** A v2 provided node of an instruction, with the path of the v1 node it comes from, e.g. an argument. */
type ProvidedEntry = { node: v2.ProvidedNode; path: V1NodePath };

/**
 * The provided nodes of an instruction, merging those providing identical
 * values under the same key.
 *
 * @throws `CODAMA_ERROR__CANNOT_UPGRADE_CONFLICTING_PROVIDED_KEY` when
 * different values are provided under the same key, e.g. by a v1 provided
 * node and an argument default, or by two names converting to the same
 * identifier, such as `max-fee` and `max_fee`.
 */
function mergeProvidedNodes(entries: readonly ProvidedEntry[]): v2.ProvidedNode[] {
    const entriesByKey = new Map<v2.IdentifierString, ProvidedEntry>();
    entries.forEach(entry => {
        const key = entry.node.identifier;
        const existing = entriesByKey.get(key);
        if (!existing) {
            entriesByKey.set(key, entry);
        } else if (!areV2NodesEqual(existing.node, entry.node)) {
            throw getConflictingProvidedKeyError(key, entry.path, existing.path);
        }
    });
    return [...entriesByKey.values()].map(({ node }) => node);
}

/**
 * Assert that no v1 injection resolves to an argument default once it is
 * provided under the name of its argument. v1 injections only resolve to v1
 * provided nodes, so such an injection would resolve to a different value.
 *
 * Injections whose key the instruction provides as a v1 provided node are
 * left out: they resolve to the same value, or the provided nodes conflict,
 * see {@link mergeProvidedNodes}. So are injections within defaults v2
 * drops, which nothing resolves in v2, see {@link getV1DroppedDefaults}.
 *
 * @throws `CODAMA_ERROR__CANNOT_UPGRADE_CONFLICTING_PROVIDED_KEY` for the
 * first such injection.
 */
function assertNoCapturedV1Injections(
    path: V1NodePath<v1.InstructionNode>,
    providedByArguments: readonly ProvidedEntry[],
): void {
    if (providedByArguments.length === 0) return;
    const instruction = getLastV1NodeFromPath(path);
    const v1ProvidedKeys = new Set((instruction.provides ?? []).map(provided => identifierFromV1(provided.name)));
    const injections = getV1InjectionsResolvedByInstruction(path);
    providedByArguments.forEach(({ node, path: argumentPath }) => {
        const injection = injections.get(node.identifier);
        if (injection && !v1ProvidedKeys.has(node.identifier)) {
            throw getConflictingProvidedKeyError(node.identifier, argumentPath, injection);
        }
    });
}

/** The v1 injections of an instruction, by v2 key, keeping the path of the first injection of each key. */
type V1InjectionsByKey = Map<v2.IdentifierString, V1NodePath<v1.InjectedValueNode>>;

type V1Provider = { key: v2.IdentifierString; path: V1NodePath<v1.Node> };

/**
 * The v1 nodes whose value an instruction provides in v2, by key: its v1
 * provided nodes, and the defaults of the arguments it provides under their
 * name, e.g. `[..., instruction, argument, defaultValue]`.
 */
function getV1Providers(path: V1NodePath<v1.InstructionNode>): V1Provider[] {
    const instruction = getLastV1NodeFromPath(path);
    const extraArguments = getV1ExtraArgumentNames(instruction);
    return [
        ...(instruction.provides ?? []).map((provided): V1Provider => ({
            key: identifierFromV1(provided.name),
            path: [...path, provided],
        })),
        ...(instruction.arguments ?? []).flatMap((argument): V1Provider[] =>
            argument.defaultValue && hasV1ProvidedDefault(argument, extraArguments)
                ? [{ key: identifierFromV1(argument.name), path: [...path, argument, argument.defaultValue] }]
                : [],
        ),
    ];
}

/**
 * The v1 injections v2 resolves from the provided nodes of an instruction,
 * when it provides their key. v2 resolves an injection from the innermost
 * instruction providing its key, so these are the injections within the
 * nodes of the instruction, following defined type links, and those its
 * sub-instructions leave to it, see {@link getV1InjectionsLeftToParent}.
 * Injections within defaults v2 drops are left out, see
 * {@link getV1DroppedDefaults}.
 */
function getV1InjectionsResolvedByInstruction(path: V1NodePath<v1.InstructionNode>): V1InjectionsByKey {
    const instruction = getLastV1NodeFromPath(path);
    const providedValues = new Set(getV1Providers(path).map(provider => getLastV1NodeFromPath(provider.path)));
    const droppedDefaults = getV1DroppedDefaults(instruction);
    const ownInjections = getV1InjectionPaths(
        path,
        node => node.kind === 'instructionNode' || providedValues.has(node) || droppedDefaults.has(node),
    );
    const subInstructionInjections = (instruction.subInstructions ?? []).flatMap(subInstruction => [
        ...getV1InjectionsLeftToParent([...path, subInstruction]).values(),
    ]);
    return getV1InjectionsByKey([...ownInjections, ...subInstructionInjections]);
}

/**
 * The v1 injections of an instruction that v2 resolves from the instructions
 * around it: those whose key the instruction does not provide, and those
 * within the values it provides, since v2 resolves the values a provider
 * provides from the instructions around it.
 */
function getV1InjectionsLeftToParent(path: V1NodePath<v1.InstructionNode>): V1InjectionsByKey {
    const providers = getV1Providers(path);
    const providedKeys = new Set(providers.map(provider => provider.key));
    const unprovidedInjections = [...getV1InjectionsResolvedByInstruction(path)].flatMap(([key, injection]) =>
        providedKeys.has(key) ? [] : [injection],
    );
    const injectionsInProvidedValues = providers.flatMap(provider => getV1InjectionPaths(provider.path));
    return getV1InjectionsByKey([...unprovidedInjections, ...injectionsInProvidedValues]);
}

/**
 * The defaults of a v1 instruction whose injections v2 cannot resolve: the
 * argument and account defaults v2 cannot express, which become
 * `codama.resolver` plugins without a default, and the defaults of extra
 * arguments, which become opaque `codama.extraArgument` plugin payloads.
 */
function getV1DroppedDefaults(instruction: v1.InstructionNode): ReadonlySet<v1.Node> {
    const extraArguments = getV1ExtraArgumentNames(instruction);
    const inputs = [...(instruction.arguments ?? []), ...(instruction.accounts ?? [])];
    return new Set([
        ...inputs.flatMap(({ defaultValue }) =>
            defaultValue && !isV1InputValueRepresentable(defaultValue, extraArguments) ? [defaultValue] : [],
        ),
        ...(instruction.extraArguments ?? []).flatMap(({ defaultValue }) => (defaultValue ? [defaultValue] : [])),
    ]);
}

function getV1InjectionsByKey(injections: readonly V1NodePath<v1.InjectedValueNode>[]): V1InjectionsByKey {
    const injectionsByKey: V1InjectionsByKey = new Map();
    injections.forEach(injection => {
        const key = identifierFromV1(getLastV1NodeFromPath(injection).key);
        if (!injectionsByKey.has(key)) injectionsByKey.set(key, injection);
    });
    return injectionsByKey;
}

function getConflictingProvidedKeyError(
    key: v2.IdentifierString,
    path: V1NodePath,
    conflictingPath: V1NodePath,
): CodamaError {
    // v1 nodes are given as nodes, as for the other errors of the upgrade.
    return new CodamaError(CODAMA_ERROR__CANNOT_UPGRADE_CONFLICTING_PROVIDED_KEY, {
        conflictingPath: conflictingPath as unknown as Node[],
        key,
        path: path as unknown as Node[],
    });
}

/** Whether two v2 nodes, or any of their attributes, are structurally equal. */
function areV2NodesEqual(left: unknown, right: unknown): boolean {
    if (left === right) return true;
    if (typeof left !== 'object' || typeof right !== 'object' || left === null || right === null) return false;
    if (Array.isArray(left) !== Array.isArray(right)) return false;
    const leftEntries = Object.entries(left);
    return (
        leftEntries.length === Object.keys(right).length &&
        leftEntries.every(
            ([key, value]) =>
                Object.hasOwn(right, key) && areV2NodesEqual(value, (right as Record<string, unknown>)[key]),
        )
    );
}

/**
 * The `codama.extraArgument` plugin of a v1 extra argument. When v2 cannot
 * express its default value, the default is dropped, and a `codama.resolver`
 * plugin on the extra argument plugin resolves it instead. The strategy of the
 * default is kept either way, as for resolved fields.
 */
function extraArgumentPluginNodeFromV1(
    path: V1NodePath<v1.InstructionArgumentNode>,
    extraArguments: ReadonlySet<string>,
): v2.PluginNode {
    const argument = getLastV1NodeFromPath(path);
    const defaultValue =
        argument.defaultValue && isV1InputValueRepresentable(argument.defaultValue, extraArguments)
            ? instructionInputValueNodeFromV1([...path, argument.defaultValue], [...path, argument.type])
            : undefined;
    const docs = docsFromV1(argument.docs);
    // A default v2 cannot express is resolved by a `codama.resolver` plugin on the extra argument plugin.
    const resolver =
        argument.defaultValue && !defaultValue
            ? resolverPluginNodeFromV1(argument.defaultValue, argument.name, path)
            : undefined;
    return compactAndFreeze({
        kind: 'pluginNode',
        namespace: 'codama.extraArgument' as v2.NamespaceString,
        payload: {
            identifier: identifierFromV1(argument.name),
            type: typeNodeFromV1([...path, argument.type]),
            ...(defaultValue ? { defaultValue } : {}),
            ...((defaultValue || resolver) && argument.defaultValueStrategy
                ? { defaultValueStrategy: argument.defaultValueStrategy }
                : {}),
            ...(docs ? { docs } : {}),
        },
        plugins: resolver ? [resolver] : undefined,
    });
}

function instructionAccountNodeFromV1(
    path: V1NodePath<v1.InstructionAccountNode>,
    extraArguments: ReadonlySet<string>,
): v2.InstructionAccountNode {
    const account = getLastV1NodeFromPath(path);
    const defaultValue = account.defaultValue;
    const isRepresentable = !defaultValue || isV1InputValueRepresentable(defaultValue, extraArguments);
    return compactAndFreeze({
        kind: 'instructionAccountNode',
        identifier: identifierFromV1(account.name),
        isWritable: account.isWritable,
        isSigner: account.isSigner,
        isOptional: account.isOptional,
        docs: docsFromV1(account.docs),
        defaultValue:
            defaultValue && isRepresentable
                ? instructionInputValueNodeFromV1([...path, defaultValue], undefined)
                : undefined,
        accountLink: account.accountLink ? linkNodeFromV1(account.accountLink) : undefined,
        display: account.display ? displayNodeFromV1(account.display) : undefined,
        plugins:
            defaultValue && !isRepresentable ? [resolverPluginNodeFromV1(defaultValue, account.name, path)] : undefined,
    });
}

/**
 * Convert the v1 remaining accounts of an instruction. Those given as an
 * argument are identified by it. Resolved ones get a `codama.resolver` plugin
 * and are identified as `remainingAccounts`, or `remainingAccounts1`, etc.,
 * whichever is not already the name of another input of the instruction.
 */
function instructionRemainingAccountsNodesFromV1(
    path: V1NodePath<v1.InstructionNode>,
): v2.InstructionRemainingAccountsNode[] | undefined {
    const instruction = getLastV1NodeFromPath(path);
    const takenNames = new Set<string>(
        [
            ...(instruction.accounts ?? []),
            ...(instruction.arguments ?? []),
            ...(instruction.extraArguments ?? []),
            ...(instruction.remainingAccounts ?? []).flatMap(({ value }) =>
                value.kind === 'argumentValueNode' ? [value] : [],
            ),
        ].map(input => identifierFromV1(input.name)),
    );
    const getFreeName = (): string => {
        for (let index = 0; ; index++) {
            const name = index === 0 ? 'remainingAccounts' : `remainingAccounts${index}`;
            if (!takenNames.has(name)) return name;
        }
    };
    return instruction.remainingAccounts?.map(remainingAccounts => {
        const value = remainingAccounts.value;
        let identifier: string = value.name;
        let plugins: v2.PluginNode[] | undefined;
        if (value.kind === 'resolverValueNode') {
            identifier = getFreeName();
            takenNames.add(identifier);
            plugins = [resolverPluginNodeFromV1(value, identifier, path)];
        }
        return compactAndFreeze({
            kind: 'instructionRemainingAccountsNode',
            identifier: identifierFromV1(identifier),
            isOptional: remainingAccounts.isOptional,
            isSigner: remainingAccounts.isSigner,
            isWritable: remainingAccounts.isWritable,
            docs: docsFromV1(remainingAccounts.docs),
            display: remainingAccounts.display ? displayNodeFromV1(remainingAccounts.display) : undefined,
            plugins,
        });
    });
}

/**
 * Convert a v1 byte delta. v2 byte deltas require a value, so those v2 cannot
 * express — resolved ones, and those relying on an extra argument — get a
 * zero value with a `codama.resolver` plugin, e.g. `resolveCreateByteDelta`.
 */
function instructionByteDeltaNodeFromV1(
    path: V1NodePath<v1.InstructionByteDeltaNode>,
    extraArguments: ReadonlySet<string>,
    index: number,
): v2.InstructionByteDeltaNode {
    const byteDelta = getLastV1NodeFromPath(path);
    const value = byteDelta.value;
    const isRepresentable =
        value.kind !== 'resolverValueNode' && !(value.kind === 'argumentValueNode' && extraArguments.has(value.name));

    let v2Value: v2.InstructionByteDeltaValue;
    if (!isRepresentable || value.kind === 'numberValueNode') {
        const number = value.kind === 'numberValueNode' ? value.number : 0;
        v2Value = compactAndFreeze({ kind: 'integerValueNode', value: integerStringFromV1(number) });
    } else if (value.kind === 'argumentValueNode') {
        v2Value = compactAndFreeze({ kind: 'dataValueNode', path: pathFromV1(value.name) });
    } else {
        v2Value = linkNodeFromV1(value as v1.AccountLinkNode);
    }

    const input = index === 0 ? 'byteDelta' : `byteDelta${index}`;
    return compactAndFreeze({
        kind: 'instructionByteDeltaNode',
        withHeader: byteDelta.withHeader,
        subtract: byteDelta.subtract,
        value: v2Value,
        plugins: isRepresentable ? undefined : [resolverPluginNodeFromV1(value, input, path)],
    });
}

function instructionStatusNodeFromV1(status: v1.InstructionStatusNode): v2.InstructionStatusNode {
    return compactAndFreeze({ kind: 'instructionStatusNode', lifecycle: status.lifecycle, message: status.message });
}

/**
 * Convert a v1 provided node. v1 IDLs provide instruction inputs, e.g. the
 * decimals of an amount display, which are converted without a type.
 *
 * @throws `CODAMA_ERROR__UNEXPECTED_NODE_KIND` for other provided nodes.
 */
function providedNodeFromV1(path: V1NodePath<v1.ProvidedNode>): v2.ProvidedNode {
    const provided = getLastV1NodeFromPath(path);
    if (!isV1InstructionInputValueNode(provided.node)) {
        throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: [],
            path: [provided.node as unknown as Node],
        });
    }
    return compactAndFreeze({
        kind: 'providedNode',
        identifier: identifierFromV1(provided.name),
        node: instructionInputValueNodeFromV1([...path, provided.node], undefined),
    });
}
