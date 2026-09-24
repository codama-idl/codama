import {
    CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES,
    CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_PLUGINS,
    CodamaError,
} from '@codama/errors';
import { camelCase } from '@codama/fragments/casing';
import { assertIsNode, isNode, Node, StructFieldTypeNode, StructTypeNode, structTypeNode } from '@codama/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor } from '@codama/visitors-core';

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
            transform: node => flattenStruct(node, options),
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
 */
export const flattenStruct = (node: Node, options: FlattenStructOptions = '*'): StructTypeNode => {
    assertIsNode(node, 'structTypeNode');
    const shouldInline = (field: StructFieldTypeNode): boolean =>
        (options === '*' || options.includes(field.identifier)) &&
        isNode(field.type, 'structTypeNode') &&
        (field.type.transforms ?? []).length === 0;
    const inlinedFields = (node.fields ?? []).flatMap(field => {
        if (!shouldInline(field)) return [field];
        const struct = field.type as StructTypeNode;
        if ((struct.plugins ?? []).length > 0) {
            throw new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_PLUGINS, {
                field,
                fieldName: field.identifier,
            });
        }
        return struct.fields ?? [];
    });

    const fieldsByCamelCase = new Map<string, StructFieldTypeNode[]>();
    inlinedFields.forEach(field => {
        const key = camelCase(field.identifier);
        fieldsByCamelCase.set(key, [...(fieldsByCamelCase.get(key) ?? []), field]);
    });
    const conflictingAttributes = [...fieldsByCamelCase.values()]
        .filter(fields => fields.length > 1)
        .flatMap(fields => [...new Set(fields.map(field => field.identifier))]);

    if (conflictingAttributes.length > 0) {
        throw new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES, {
            conflictingAttributes,
        });
    }

    return structTypeNode(inlinedFields, { ...node });
};
