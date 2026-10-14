import { type DecodedNode, getDecodedNodeAtPath, isDecodedNode } from '@codama/dynamic-codecs';
import type { ParsedInstruction } from '@codama/dynamic-parsers';
import {
    findProgramNodeFromPath,
    getLastNodeFromPath,
    getProvidedScopeFromPath,
    type InjectedValueNode,
    INSTRUCTION_INPUT_VALUE_NODE_KINDS,
    integerValueNode,
    isNode,
    type LinkableDictionary,
    type NodePath,
    publicKeyValueNode,
    stringValueNode,
    VALUE_NODE_KINDS,
    type ValueNode,
} from 'codama';

import { getAccountAddress } from './accounts';
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
 * | `dataValueNode` | The integer, string or address at its path within the instruction data |
 * | Anything else, e.g. `accountDataValueNode` | Unresolved |
 *
 * Values the instruction does not hold, e.g. an account that is not provided, are unresolved, so
 * the formatters present them with confidence or not at all.
 */
export function getInjectedValueResolver(
    parsed: ParsedInstruction,
    linkables: LinkableDictionary,
): (path: NodePath<InjectedValueNode>) => ValueNode | undefined {
    const scope = getProvidedScopeFromPath(parsed.path);
    return path => {
        const node = scope.resolve(getLastNodeFromPath(path), { kinds: INSTRUCTION_INPUT_VALUE_NODE_KINDS });
        if (node === undefined) return undefined;
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
        if (isNode(node, 'dataValueNode')) {
            // Paths crossing account links need account data, which is not available here.
            const decoded = getDecodedNodeAtPath(parsed, node.path, { resolveAccountLink: () => undefined });
            return decoded ? getValueNode(decoded) : undefined;
        }
        return undefined;
    };
}

/** The value node of a decoded integer, string or public key, e.g. within a struct field. */
function getValueNode(decoded: DecodedNode): ValueNode | undefined {
    if (isDecodedNode(decoded, 'structFieldTypeNode')) return getValueNode(decoded.type);
    if (isDecodedNode(decoded, 'integerTypeNode')) return integerValueNode(decoded.value.toString());
    if (isDecodedNode(decoded, 'stringTypeNode')) return stringValueNode(decoded.value);
    if (isDecodedNode(decoded, 'publicKeyTypeNode')) return publicKeyValueNode(decoded.value);
    return undefined;
}
