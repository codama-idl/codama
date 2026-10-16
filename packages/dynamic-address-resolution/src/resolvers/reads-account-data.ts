import { CODAMA_ERROR__CANNOT_RESOLVE_PATH, isCodamaError } from '@codama/errors';
import {
    extendVisitor,
    getLastNodeFromPath,
    getLinkablesFromNode,
    getProvidedScopeFromPath,
    INSTRUCTION_INPUT_VALUE_NODE_KINDS,
    type InstructionNode,
    type LinkableDictionary,
    mergeVisitor,
    type Node,
    type NodePath,
    type PathString,
    resolveTypePath,
    visit,
} from 'codama';

import { getDataFieldPaths } from './resolve-instruction-data-default-values';

/**
 * Whether building the instruction at the end of the given path may read account data, and thus
 * requires a `fetchAccounts` function: when the default value of one of its accounts or top-level
 * data fields, once its injected values are resolved, contains an `accountDataValueNode` or a
 * `dataValueNode` whose path crosses the `accountLink` of a public key, e.g. `mint.data.decimals`.
 * Links are followed using the linkable nodes of the tree, recorded from its root unless given.
 *
 * @example
 * ```ts
 * readsAccountData([root, root.program, transferChecked]); // true when its decimals default to the mint's
 * ```
 */
export function readsAccountData(
    path: NodePath<InstructionNode>,
    linkables: LinkableDictionary = getLinkablesFromNode(path[0]),
): boolean {
    const instruction = getLastNodeFromPath(path);
    const scope = getProvidedScopeFromPath(path);

    const crossesAccountLink = (dataPath: PathString): boolean => {
        if (!instruction.data) return false;
        const source = [...path, instruction.data] as const;
        try {
            resolveTypePath(source, dataPath, linkables);
            return false;
        } catch (error) {
            if (!isCodamaError(error, CODAMA_ERROR__CANNOT_RESOLVE_PATH)) throw error;
        }
        // Paths resolving neither way are invalid, for validators to report.
        try {
            resolveTypePath(source, dataPath, linkables, { followAccountLinks: true });
            return true;
        } catch (error) {
            if (!isCodamaError(error, CODAMA_ERROR__CANNOT_RESOLVE_PATH)) throw error;
            return false;
        }
    };

    const visitor = extendVisitor(
        mergeVisitor(
            () => false,
            (_, values) => values.some(Boolean),
        ),
        {
            visitAccountDataValue: () => true,
            visitDataValue: node => crossesAccountLink(node.path),
        },
    );
    const reads = (defaultValue: Node | undefined): boolean => {
        if (!defaultValue) return false;
        const resolved = scope.resolve(defaultValue, { kinds: INSTRUCTION_INPUT_VALUE_NODE_KINDS });
        return resolved !== undefined && visit(resolved, visitor);
    };

    return (
        (instruction.accounts ?? []).some(account => reads(account.defaultValue)) ||
        getDataFieldPaths({ instructionPath: path, linkables }).some(fieldPath =>
            reads(getLastNodeFromPath(fieldPath).defaultValue),
        )
    );
}
