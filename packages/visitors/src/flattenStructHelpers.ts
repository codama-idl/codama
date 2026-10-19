import { CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_PLUGINS, CodamaError } from '@codama/errors';
import { camelCase } from '@codama/fragments/casing';
import {
    assertIsNode,
    IdentifierString,
    isNode,
    Node,
    StructFieldTypeNode,
    StructTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { NodePath } from '@codama/visitors-core';

/** The result of inlining the struct-typed fields of a struct, see {@link getFlattenedStruct}. */
export type FlattenedStruct = {
    /** The identifiers of the resulting fields sharing a camelCase form with another one. */
    conflictingAttributes: IdentifierString[];
    /** The identifiers of the fields whose own fields were inlined. */
    inlinedFields: IdentifierString[];
    /** The struct with its fields inlined, regardless of conflicts. */
    struct: StructTypeNode;
};

/**
 * Inline the fields of the struct-typed fields of `node`, either all of
 * them (`'*'`) or those whose identifiers are listed (matched exactly), and
 * report the resulting fields that conflict instead of throwing, so callers
 * can decide what to do with them.
 *
 * A field whose struct carries `transforms` is kept as is, since inlining
 * its fields would drop the transforms and change the wire format.
 *
 * @throws {CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_PLUGINS} if
 * a struct to inline carries `plugins`, since they would be lost.
 *
 * @param path - The path of the struct, used by errors.
 */
export function getFlattenedStruct(node: Node, options: string[] | '*', path: NodePath): FlattenedStruct {
    assertIsNode(node, 'structTypeNode');
    const shouldInline = (field: StructFieldTypeNode): boolean =>
        (options === '*' || options.includes(field.identifier)) &&
        isNode(field.type, 'structTypeNode') &&
        (field.type.transforms ?? []).length === 0;
    const inlinedFields: IdentifierString[] = [];
    const fields = (node.fields ?? []).flatMap(field => {
        if (!shouldInline(field)) return [field];
        const struct = field.type as StructTypeNode;
        if ((struct.plugins ?? []).length > 0) {
            throw new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_PLUGINS, {
                path: [...path, field],
            });
        }
        inlinedFields.push(field.identifier);
        return struct.fields ?? [];
    });

    const fieldsByCamelCase = new Map<string, StructFieldTypeNode[]>();
    fields.forEach(field => {
        const key = camelCase(field.identifier);
        fieldsByCamelCase.set(key, [...(fieldsByCamelCase.get(key) ?? []), field]);
    });
    const conflictingAttributes = [...fieldsByCamelCase.values()]
        .filter(conflictingFields => conflictingFields.length > 1)
        .flatMap(conflictingFields => [...new Set(conflictingFields.map(field => field.identifier))]);

    return { conflictingAttributes, inlinedFields, struct: structTypeNode(fields, { ...node }) };
}
