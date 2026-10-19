import { CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES, CodamaError } from '@codama/errors';
import { Node, StructTypeNode } from '@codama/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor, NodePath } from '@codama/visitors-core';

import { getFlattenedStruct } from './flattenStructHelpers';

export type FlattenStructOptions = string[] | '*';

/**
 * Inline the fields of struct-typed fields into their parent struct, for
 * every struct matching the given selectors.
 *
 * @example
 * ```ts
 * // Flatten all struct fields of the `myAccount` account's data.
 * flattenStructVisitor({ myAccount: '*' });
 * // Only flatten its `config` field.
 * flattenStructVisitor({ myAccount: ['config'] });
 * ```
 */
export function flattenStructVisitor(map: Record<string, FlattenStructOptions>) {
    return bottomUpTransformerVisitor(
        Object.entries(map).map(([stack, options]): BottomUpNodeTransformerWithSelector => ({
            select: `${stack}.[structTypeNode]`,
            transform: (node, stack) => flattenStruct(node, options, stack.getPath()),
        })),
    );
}

/**
 * Inline the fields of the struct-typed fields of `node`, either all of
 * them (`'*'`) or those whose identifiers are listed (matched exactly).
 *
 * A field whose struct carries `transforms` is kept as is, since inlining
 * its fields would drop the transforms and change the wire format.
 *
 * @throws {CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_PLUGINS} if
 * a struct to inline carries `plugins`, since they would be lost.
 * @throws {CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES}
 * if two resulting fields share a camelCase form, as they would then collide
 * under the spec's casing-collision rule.
 *
 * @param path - The path of the struct, used by errors. Defaults to the struct itself.
 */
export const flattenStruct = (
    node: Node,
    options: FlattenStructOptions = '*',
    path: NodePath = [node],
): StructTypeNode => {
    const { conflictingAttributes, struct } = getFlattenedStruct(node, options, path);
    if (conflictingAttributes.length > 0) {
        throw new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES, {
            conflictingAttributes,
            path,
        });
    }
    return struct;
};
