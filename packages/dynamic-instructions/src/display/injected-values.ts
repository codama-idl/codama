import { type DecodedNode, getDecodedNodeAtPath, isDecodedNode } from '@codama/dynamic-codecs';
import {
    findProgramNodeFromPath,
    getLastNodeFromPath,
    getProvidedScopeFromPath,
    type InjectedValueNode,
    INSTRUCTION_INPUT_VALUE_NODE_KINDS,
    type InstructionInputValueNode,
    integerValueNode,
    isNode,
    type NodePath,
    publicKeyValueNode,
    stringValueNode,
    VALUE_NODE_KINDS,
    type ValueNode,
} from 'codama';

import { type DisplayContext, getAccountAddress, getInstructionAccountData, getLinkedAccountData } from './accounts';

/**
 * Create the `resolveInjectedValue` option of the formatters for a parsed instruction: injected
 * values of display nodes, e.g. the `decimals` of an amount, resolve from the `provides` of the
 * instruction and its parents, then to the value node they stand for.
 *
 * | Resolved node | Value node |
 * | --- | --- |
 * | A value node | Itself |
 * | `accountValueNode` | The address of the account, as a `publicKeyValueNode`, unless it is omitted |
 * | `programIdValueNode`, `programLinkNode` | The address of the program, as a `publicKeyValueNode` |
 * | `dataValueNode` | The integer, string or address at its path within the instruction data, following account links |
 * | `accountDataValueNode` | The integer, string or address at its path within the data of the account |
 * | Anything else, e.g. `pdaValueNode` | Unresolved |
 *
 * Values that are not available, e.g. an omitted account or account data that was not fetched,
 * are unresolved, so the formatters present them with confidence or not at all. Each resolved
 * node is given to `onResolved`, e.g. to know which members the value was read from.
 */
export function getInjectedValueResolver(
    context: DisplayContext,
    onResolved?: (node: InstructionInputValueNode) => void,
): (path: NodePath<InjectedValueNode>) => ValueNode | undefined {
    const scope = getProvidedScopeFromPath(context.parsed.path);
    return path => {
        const node = scope.resolve(getLastNodeFromPath(path), { kinds: INSTRUCTION_INPUT_VALUE_NODE_KINDS });
        const value = node === undefined ? undefined : getValueNodeOf(context, node);
        if (node !== undefined && value !== undefined) onResolved?.(node);
        return value;
    };
}

function getValueNodeOf(context: DisplayContext, node: InstructionInputValueNode): ValueNode | undefined {
    const { linkables, parsed } = context;
    if (isNode(node, VALUE_NODE_KINDS)) return node;
    if (isNode(node, 'accountValueNode')) {
        const address = getAccountAddress(parsed, node.identifier);
        return address === undefined ? undefined : publicKeyValueNode(address);
    }
    if (isNode(node, 'programIdValueNode')) {
        const program = findProgramNodeFromPath(parsed.path);
        return program ? publicKeyValueNode(program.publicKey) : undefined;
    }
    if (isNode(node, 'programLinkNode')) {
        return publicKeyValueNode(linkables.getOrThrow([...parsed.path, node]).publicKey);
    }
    const resolveAccountLink = getLinkedAccountData.bind(null, context);
    if (isNode(node, 'dataValueNode')) {
        const decoded = getDecodedNodeAtPath(parsed, node.path, { resolveAccountLink });
        return decoded ? getValueNode(decoded) : undefined;
    }
    if (isNode(node, 'accountDataValueNode')) {
        const account = getInstructionAccountData(context, node.account);
        if (!account) return undefined;
        const decoded = node.path ? getDecodedNodeAtPath(account, node.path, { resolveAccountLink }) : account;
        return decoded ? getValueNode(decoded) : undefined;
    }
    return undefined;
}

/** The value node of a decoded integer, string or public key, e.g. within a struct field or an account. */
function getValueNode(decoded: DecodedNode): ValueNode | undefined {
    if (isDecodedNode(decoded, 'accountNode')) return getValueNode(decoded.data);
    if (isDecodedNode(decoded, 'structFieldTypeNode')) return getValueNode(decoded.type);
    if (isDecodedNode(decoded, 'integerTypeNode')) return integerValueNode(decoded.value.toString());
    if (isDecodedNode(decoded, 'stringTypeNode')) return stringValueNode(decoded.value);
    if (isDecodedNode(decoded, 'publicKeyTypeNode')) return publicKeyValueNode(decoded.value);
    return undefined;
}
