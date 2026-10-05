import { CODAMA_ERROR__UNEXPECTED_NODE_KIND, CodamaError } from '@codama/errors';
import type { Node } from '@codama/node-types';

import type * as v1 from '../v1';
import type * as v2 from '../v2';
import {
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
 */
export function instructionNodeFromV1(path: V1NodePath<v1.InstructionNode>): v2.InstructionNode {
    const instruction = getLastV1NodeFromPath(path);
    const extraArguments = new Set((instruction.extraArguments ?? []).map(argument => argument.name));
    const fields = (instruction.arguments ?? []).map(argument =>
        instructionArgumentFromV1([...path, argument], extraArguments),
    );
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
        provides: [
            ...(instruction.provides ?? []).map(provided => providedNodeFromV1([...path, provided])),
            ...fields.flatMap(({ provided }) => (provided ? [provided] : [])),
        ],
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
    } else if (defaultValue && isV1ContextualInputValueNode(defaultValue)) {
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
            kind: null,
            node: provided.node as unknown as Node,
        });
    }
    return compactAndFreeze({
        kind: 'providedNode',
        identifier: identifierFromV1(provided.name),
        node: instructionInputValueNodeFromV1([...path, provided.node], undefined),
    });
}
