import { CODAMA_ERROR__CANNOT_RESOLVE_PATH, CODAMA_ERROR__LINKED_NODE_NOT_FOUND, isCodamaError } from '@codama/errors';
import {
    AccountDataValueNode,
    AccountValueNode,
    DataValueNode,
    isNode,
    Node,
    PathString,
    TypeNode,
} from '@codama/nodes';
import {
    getLastNodeFromPath,
    getNodePathUntilLastNode,
    LinkableDictionary,
    NodePath,
    resolveTypePath,
} from '@codama/visitors-core';

import { ValidationItem, validationItem } from './ValidationItem';

/**
 * The items of a contextual value referring to its enclosing instruction, e.g. the account of an
 * `accountBumpValueNode` checked as an `accountValueNode`:
 * the data path of a `dataValueNode` must resolve within the instruction
 * data, and the account of an `accountDataValueNode` or `accountValueNode`
 * must be an account of the instruction, with an account link for the
 * former so its data path can resolve within the linked account's data.
 * Paths may cross account links. Values outside instructions are skipped,
 * and so are links that cannot be resolved, which are reported on their own.
 *
 * @param value - The contextual value, e.g. a node of the path or a placeholder of an interpolated intent.
 * @param itemPath - The path the items point to, ending with the value or the node holding it.
 */
export function getContextualValueItems(
    value: AccountDataValueNode | AccountValueNode | DataValueNode,
    itemPath: NodePath<Node>,
    linkables: LinkableDictionary,
): ValidationItem[] {
    const instructionPath = getNodePathUntilLastNode(itemPath, 'instructionNode');
    if (!instructionPath) return [];
    const instruction = getLastNodeFromPath(instructionPath);

    if (isNode(value, 'dataValueNode')) {
        if (!instruction.data) {
            const message = `Data path "${value.path}" cannot be resolved as instruction "${instruction.identifier}" has no data.`;
            return [validationItem('error', message, itemPath)];
        }
        return getPathItems([...instructionPath, instruction.data], value.path, itemPath, linkables);
    }

    const accountName = isNode(value, 'accountValueNode') ? value.identifier : value.account;
    const account = (instruction.accounts ?? []).find(a => a.identifier === accountName);
    if (!account) {
        const message = `Account "${accountName}" is not an account of instruction "${instruction.identifier}".`;
        return [validationItem('error', message, itemPath)];
    }
    if (isNode(value, 'accountValueNode')) return [];
    if (!account.accountLink) {
        const message = `Account "${accountName}" has no account link, so its data cannot be read.`;
        return [validationItem('error', message, itemPath)];
    }
    if (value.path === undefined) return [];
    const linkedAccountPath = linkables.getPath([...instructionPath, account, account.accountLink]);
    if (!linkedAccountPath) return [];
    const linkedAccount = getLastNodeFromPath(linkedAccountPath);
    return getPathItems([...linkedAccountPath, linkedAccount.data], value.path, itemPath, linkables);
}

/** The items of a path that cannot be resolved against the type at the end of `source`. */
function getPathItems(
    source: readonly [...NodePath, TypeNode],
    path: PathString,
    itemPath: NodePath<Node>,
    linkables: LinkableDictionary,
): ValidationItem[] {
    try {
        resolveTypePath(source, path, linkables, { followAccountLinks: true });
        return [];
    } catch (error) {
        if (isCodamaError(error, CODAMA_ERROR__LINKED_NODE_NOT_FOUND)) return [];
        if (isCodamaError(error, CODAMA_ERROR__CANNOT_RESOLVE_PATH)) {
            return [validationItem('error', error.message, itemPath, error)];
        }
        throw error;
    }
}
