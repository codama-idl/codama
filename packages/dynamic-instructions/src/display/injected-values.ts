import {
    type DecodedNode,
    type FormatDecodedNodeOptions,
    getDecodedNodeAtPath,
    isDecodedNode,
} from '@codama/dynamic-codecs';
import {
    findProgramNodeFromPath,
    getLastNodeFromPath,
    getProvidedScopeFromPath,
    INSTRUCTION_INPUT_VALUE_NODE_KINDS,
    type InstructionInputValueNode,
    integerValueNode,
    isNode,
    parsePath,
    pathString,
    type ProvidedScope,
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
 * Values that are not available, e.g. an omitted account or account data that was not fetched, are
 * unresolved, so the formatters present them with confidence or not at all. Values within fields
 * skipped `always` of the formatted node are not shown, so they are not resolved either, and the
 * accounts only they read are not fetched. Each value read from a member, e.g. `account:mint` or
 * `data:config.fee`, is given to `onRead` with the decoded nodes containing the value, e.g. to know
 * which rows present that member. The `provides` come from the given scope, which defaults to those
 * of the instruction and its parents.
 */
export function getInjectedValueResolver(
    context: DisplayContext,
    onRead?: (member: string, parents: readonly DecodedNode[]) => void,
    scope: ProvidedScope = getProvidedScopeFromPath(context.parsed.path),
): NonNullable<FormatDecodedNodeOptions['resolveInjectedValue']> {
    return (path, parents) => {
        // The formatted node itself is shown, e.g. a hidden field a placeholder refers to.
        if (parents.slice(1).some(isFieldSkippedAlways)) return undefined;
        const node = scope.resolve(getLastNodeFromPath(path), { kinds: INSTRUCTION_INPUT_VALUE_NODE_KINDS });
        const value = node === undefined ? undefined : getValueNodeOf(context, node);
        const member = node === undefined || value === undefined ? undefined : getReadMember(context, node);
        if (member !== undefined) onRead?.(member, parents);
        return value;
    };
}

function isFieldSkippedAlways(decoded: DecodedNode): boolean {
    return (
        isDecodedNode(decoded, 'structFieldTypeNode') && getLastNodeFromPath(decoded.path).display?.skip === 'always'
    );
}

/** The member a resolved injected value is read from, if any: an account, or a field of the instruction data. */
function getReadMember(context: DisplayContext, node: InstructionInputValueNode): string | undefined {
    if (isNode(node, 'accountValueNode')) return `account:${node.identifier}`;
    if (isNode(node, 'accountDataValueNode')) return `account:${node.account}`;
    if (isNode(node, 'dataValueNode')) {
        const path = getDataMemberPath(context, node.path);
        return path === undefined ? undefined : `data:${path}`;
    }
    return undefined;
}

/**
 * The path of the field of the instruction data a data path reads: its field segments, up to an
 * index or an account link, e.g. `config.fee` for `config.fee`, `mint` for `mint.data.decimals` when
 * `mint` links to an account, or `fees` for `fees[0]`.
 */
function getDataMemberPath(context: DisplayContext, path: string): string | undefined {
    let memberPath: string | undefined;
    for (const segment of parsePath(path)) {
        if (segment.kind === 'index') break;
        const next = memberPath === undefined ? segment.identifier : `${memberPath}.${segment.identifier}`;
        const node = getDecodedNodeAtPath(context.parsed, pathString(next), { resolveAccountLink: () => undefined });
        if (!node) break;
        memberPath = next;
    }
    return memberPath;
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
