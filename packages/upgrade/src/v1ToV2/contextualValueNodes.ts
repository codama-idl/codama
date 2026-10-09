import { CODAMA_ERROR__UNEXPECTED_NODE_KIND, CodamaError } from '@codama/errors';
import type { Node } from '@codama/node-types';

import type * as v1 from '../v1';
import type * as v2 from '../v2';
import { linkNodeFromV1 } from './linkNodes';
import { getLastV1NodeFromPath, getV1InstructionFromPath, getV1LinkedPdaPath, V1NodePath } from './paths';
import { pdaNodeFromV1 } from './pdaNodes';
import { compactAndFreeze, docsFromV1, identifierFromV1, pathFromV1 } from './shared';
import { valueNodeFromV1 } from './valueNodes';

/** v1 contextual value nodes and program links, i.e. the instruction inputs that are not plain values. */
type V1ContextualInputValueNode = v1.ContextualValueNode | v1.ProgramLinkNode;

const CONTEXTUAL_INPUT_KINDS: readonly string[] = [
    'accountBumpValueNode',
    'accountFieldValueNode',
    'accountValueNode',
    'argumentValueNode',
    'conditionalValueNode',
    'identityValueNode',
    'payerValueNode',
    'pdaValueNode',
    'programIdValueNode',
    'programLinkNode',
    'resolverValueNode',
] satisfies V1ContextualInputValueNode['kind'][];

const VALUE_KINDS: readonly string[] = [
    'arrayValueNode',
    'booleanValueNode',
    'bytesValueNode',
    'constantValueNode',
    'enumValueNode',
    'injectedValueNode',
    'mapValueNode',
    'noneValueNode',
    'numberValueNode',
    'publicKeyValueNode',
    'setValueNode',
    'someValueNode',
    'stringValueNode',
    'structValueNode',
    'tupleValueNode',
] satisfies v1.ValueNode['kind'][];

/** Whether a v1 node is an instruction input, i.e. a value, a contextual value or a program link. */
export function isV1InstructionInputValueNode(node: v1.Node): node is v1.InstructionInputValueNode {
    return VALUE_KINDS.includes(node.kind) || CONTEXTUAL_INPUT_KINDS.includes(node.kind);
}

/** Whether a v1 instruction input is contextual, i.e. not a plain value. */
export function isV1ContextualInputValueNode(node: v1.InstructionInputValueNode): node is V1ContextualInputValueNode {
    return CONTEXTUAL_INPUT_KINDS.includes(node.kind);
}

/**
 * Convert a v1 instruction input value, e.g. the default value of an
 * instruction account, given the path of the v1 type it is a value of, if
 * known. References to arguments become references to the instruction data.
 *
 * Resolvers have no v2 counterpart and must be handled by the caller, see
 * {@link isV1InputValueRepresentable}.
 *
 * @throws `CODAMA_ERROR__UNEXPECTED_NODE_KIND` for resolvers.
 */
export function instructionInputValueNodeFromV1(
    path: V1NodePath<v1.InstructionInputValueNode>,
    typePath: V1NodePath<v1.TypeNode> | undefined,
): v2.InstructionInputValueNode {
    const value = getLastV1NodeFromPath(path);
    switch (value.kind) {
        case 'accountBumpValueNode':
            return compactAndFreeze({ kind: value.kind, identifier: identifierFromV1(value.name) });
        case 'accountFieldValueNode':
            return compactAndFreeze({
                kind: 'accountDataValueNode',
                account: identifierFromV1(value.account),
                path: value.path ? pathFromV1(value.path) : undefined,
            });
        case 'accountValueNode':
            return accountValueNodeFromV1(value);
        case 'argumentValueNode':
            return dataValueNodeFromV1(value);
        case 'conditionalValueNode':
            return conditionalValueNodeFromV1(path as V1NodePath<v1.ConditionalValueNode>, typePath);
        case 'identityValueNode':
        case 'payerValueNode':
        case 'programIdValueNode':
            return compactAndFreeze({ kind: value.kind });
        case 'pdaValueNode':
            return pdaValueNodeFromV1(path as V1NodePath<v1.PdaValueNode>);
        case 'programLinkNode':
            return linkNodeFromV1(value);
        case 'resolverValueNode':
            throw getUnexpectedResolverError(value);
        default:
            return valueNodeFromV1(path as V1NodePath<v1.ValueNode>, typePath);
    }
}

/** v1 resolvers have no v2 node: they become `codama.resolver` plugins on the node they resolve. */
function getUnexpectedResolverError(value: v1.ResolverValueNode): CodamaError {
    return new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
        expectedKinds: [],
        kind: null,
        node: value as unknown as Node,
    });
}

function accountValueNodeFromV1(value: v1.AccountValueNode): v2.AccountValueNode {
    return compactAndFreeze({ kind: 'accountValueNode', identifier: identifierFromV1(value.name) });
}

/** v1 arguments are referenced by name, which is a valid v2 path to the same top-level data field. */
function dataValueNodeFromV1(value: v1.ArgumentValueNode): v2.DataValueNode {
    return compactAndFreeze({ kind: 'dataValueNode', path: pathFromV1(value.name) });
}

/**
 * Convert a v1 conditional value. The value it compares against is typed by
 * the argument of its condition, and its branches by the type of the input.
 */
function conditionalValueNodeFromV1(
    path: V1NodePath<v1.ConditionalValueNode>,
    typePath: V1NodePath<v1.TypeNode> | undefined,
): v2.ConditionalValueNode {
    const value = getLastV1NodeFromPath(path);
    const condition = value.condition;
    if (condition.kind === 'resolverValueNode') throw getUnexpectedResolverError(condition);
    return compactAndFreeze({
        kind: 'conditionalValueNode',
        condition:
            condition.kind === 'accountValueNode' ? accountValueNodeFromV1(condition) : dataValueNodeFromV1(condition),
        value: value.value ? valueNodeFromV1([...path, value.value], getConditionTypePath(path)) : undefined,
        ifTrue: value.ifTrue ? instructionInputValueNodeFromV1([...path, value.ifTrue], typePath) : undefined,
        ifFalse: value.ifFalse ? instructionInputValueNodeFromV1([...path, value.ifFalse], typePath) : undefined,
    });
}

/** The path of the type of the argument a v1 condition refers to, if any. */
function getConditionTypePath(path: V1NodePath<v1.ConditionalValueNode>): V1NodePath<v1.TypeNode> | undefined {
    const condition = getLastV1NodeFromPath(path).condition;
    if (condition.kind !== 'argumentValueNode') return undefined;
    const instruction = getV1InstructionFromPath(path);
    const argument = instruction?.arguments?.find(candidate => candidate.name === condition.name);
    if (!instruction || !argument) return undefined;
    const instructionPath = path.slice(0, path.lastIndexOf(instruction) + 1);
    return [...instructionPath, argument, argument.type];
}

/** Convert a v1 PDA value. Its seed values are typed by the seeds of the PDA, following links. */
function pdaValueNodeFromV1(path: V1NodePath<v1.PdaValueNode>): v2.PdaValueNode {
    const value = getLastV1NodeFromPath(path);
    const pdaPath: V1NodePath<v1.PdaNode> | undefined =
        value.pda.kind === 'pdaLinkNode' ? getV1LinkedPdaPath([...path, value.pda]) : [...path, value.pda];
    const pda = pdaPath ? getLastV1NodeFromPath(pdaPath) : undefined;
    return compactAndFreeze({
        kind: 'pdaValueNode',
        pda: value.pda.kind === 'pdaLinkNode' ? linkNodeFromV1(value.pda) : pdaNodeFromV1([...path, value.pda]),
        seeds: value.seeds?.map((seed): v2.PdaSeedValueNode => {
            const seedNode = pda?.seeds?.find(
                (candidate): candidate is v1.VariablePdaSeedNode =>
                    candidate.kind === 'variablePdaSeedNode' && candidate.name === seed.name,
            );
            const seedTypePath: V1NodePath<v1.TypeNode> | undefined =
                pdaPath && seedNode ? [...pdaPath, seedNode, seedNode.type] : undefined;
            return compactAndFreeze({
                kind: 'pdaSeedValueNode',
                identifier: identifierFromV1(seed.name),
                value:
                    seed.value.kind === 'accountValueNode'
                        ? accountValueNodeFromV1(seed.value)
                        : seed.value.kind === 'argumentValueNode'
                          ? dataValueNodeFromV1(seed.value)
                          : valueNodeFromV1([...path, seed, seed.value], seedTypePath),
            });
        }),
        programId: value.programId
            ? value.programId.kind === 'accountValueNode'
                ? accountValueNodeFromV1(value.programId)
                : dataValueNodeFromV1(value.programId)
            : undefined,
    });
}

/**
 * Whether a v1 instruction input can be expressed in v2. v2 has no resolvers
 * and no extra arguments, so inputs relying on a resolver — e.g. as the
 * condition of a conditional value — or on an extra argument cannot be.
 */
export function isV1InputValueRepresentable(value: v1.InstructionInputValueNode, extraArguments: ReadonlySet<string>) {
    return !someV1Node(
        value,
        node =>
            node.kind === 'resolverValueNode' || (node.kind === 'argumentValueNode' && extraArguments.has(node.name)),
    );
}

/**
 * The inputs a v1 instruction input depends on, as `codama.resolver`
 * dependencies, e.g. `accounts.mint` or `data.amount`, without duplicates.
 * Arguments include extra arguments, as `data.*` dependencies cover them.
 *
 * The seeds a PDA value omits are included too, as v1 tooling fills them from
 * the instruction input of the same name: a public key seed from an account,
 * otherwise from an argument.
 *
 * @param path - The path of a node within the instruction, used to find the
 * instruction and the PDAs it links to.
 */
export function getV1InputDependencies(value: v1.Node, path: V1NodePath): string[] {
    const dependencies = new Set<string>();
    someV1Node(value, node => {
        switch (node.kind) {
            case 'accountBumpValueNode':
            case 'accountValueNode':
                dependencies.add(`accounts.${identifierFromV1(node.name)}`);
                break;
            case 'accountFieldValueNode':
                dependencies.add(`accounts.${identifierFromV1(node.account)}`);
                break;
            case 'argumentValueNode':
                dependencies.add(`data.${pathFromV1(node.name)}`);
                break;
            case 'pdaValueNode':
                getV1OmittedPdaSeedDependencies(node, path).forEach(dependency => dependencies.add(dependency));
                break;
        }
        return false;
    });
    return [...dependencies];
}

/** The dependencies v1 tooling fills the omitted seeds of a PDA value from. */
function getV1OmittedPdaSeedDependencies(value: v1.PdaValueNode, path: V1NodePath): string[] {
    const instruction = getV1InstructionFromPath(path);
    if (!instruction) return [];
    const pdaPath: V1NodePath<v1.PdaNode> | undefined =
        value.pda.kind === 'pdaLinkNode' ? getV1LinkedPdaPath([...path, value.pda]) : [...path, value.pda];
    const pda = pdaPath ? getLastV1NodeFromPath(pdaPath) : undefined;
    const givenSeeds = new Set((value.seeds ?? []).map(seed => seed.name));
    const accounts = new Set((instruction.accounts ?? []).map(account => account.name));
    const data = new Set(
        [...(instruction.arguments ?? []), ...(instruction.extraArguments ?? [])].map(argument => argument.name),
    );
    return (pda?.seeds ?? []).flatMap(seed => {
        if (seed.kind !== 'variablePdaSeedNode' || givenSeeds.has(seed.name)) return [];
        if (seed.type.kind === 'publicKeyTypeNode' && accounts.has(seed.name)) {
            return [`accounts.${identifierFromV1(seed.name)}`];
        }
        return data.has(seed.name) ? [`data.${pathFromV1(seed.name)}`] : [];
    });
}

/**
 * A `codama.resolver` plugin, marking a node whose value renderers resolve
 * with custom code.
 */
export function resolverPluginNode(
    name: string,
    options: { dependsOn?: readonly string[]; docs?: string } = {},
): v2.PluginNode {
    const { dependsOn = [], docs } = options;
    return compactAndFreeze({
        kind: 'pluginNode',
        namespace: 'codama.resolver' as v2.NamespaceString,
        payload: {
            name,
            ...(dependsOn.length > 0 ? { dependsOn: [...dependsOn] } : {}),
            ...(docs ? { docs } : {}),
        },
    });
}

/**
 * The `codama.resolver` plugin of a v1 input that cannot be expressed in v2.
 * A resolver keeps its name, dependencies and docs. Any other input gets a new
 * resolver named after its instruction and itself, e.g. `resolveBurnEdition`,
 * depending on everything the v1 input depends on: renderers must resolve the
 * whole input, not only the parts v2 cannot express.
 *
 * @param path - The path of the node the input belongs to, within its instruction.
 */
export function resolverPluginNodeFromV1(
    value: v1.InstructionInputValueNode | v1.InstructionByteDeltaValue | v1.InstructionRemainingAccountsValue,
    input: string,
    path: V1NodePath,
): v2.PluginNode {
    if (value.kind === 'resolverValueNode') {
        return resolverPluginNode(value.name, {
            dependsOn: [
                ...new Set((value.dependsOn ?? []).flatMap(dependency => getV1InputDependencies(dependency, path))),
            ],
            docs: docsFromV1(value.docs),
        });
    }
    const instruction = getV1InstructionFromPath(path);
    const name = `resolve${capitalise(identifierFromV1(instruction?.name ?? ''))}${capitalise(identifierFromV1(input))}`;
    return resolverPluginNode(name, { dependsOn: getV1InputDependencies(value, path) });
}

function capitalise(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Whether a v1 node or any node it holds matches the given predicate, visiting nodes depth-first. */
function someV1Node(node: v1.Node, predicate: (node: v1.Node) => boolean): boolean {
    if (predicate(node)) return true;
    return Object.values(node).some(child => someV1Child(child, predicate));
}

function someV1Child(child: unknown, predicate: (node: v1.Node) => boolean): boolean {
    if (Array.isArray(child)) return child.some(item => someV1Child(item, predicate));
    if (typeof child !== 'object' || child === null || !('kind' in child)) return false;
    return someV1Node(child as v1.Node, predicate);
}
