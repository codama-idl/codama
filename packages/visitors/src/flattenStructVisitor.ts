import { CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES, CodamaError } from '@codama/errors';
import {
    assertIsNode,
    camelCase,
    isNode,
    Node,
    StructFieldTypeNode,
    StructTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor } from '@codama/visitors-core';

export type FlattenStructOptions = string[] | '*';

export function flattenStructVisitor(map: Record<string, FlattenStructOptions>) {
    return bottomUpTransformerVisitor(
        Object.entries(map).map(
            ([stack, options]): BottomUpNodeTransformerWithSelector => ({
                select: `${stack}.[structTypeNode]`,
                transform: node => flattenStruct(node, options),
            }),
        ),
    );
}

export const flattenStruct = (node: Node, options: FlattenStructOptions = '*'): StructTypeNode => {
    assertIsNode(node, 'structTypeNode');
    const camelCaseOptions = options === '*' ? options : options.map(camelCase);
    const shouldInline = (field: StructFieldTypeNode): boolean =>
        options === '*' || camelCaseOptions.includes(camelCase(field.name));
    const inlinedFields = node.fields.flatMap(field => {
        if (isNode(field.type, 'structTypeNode') && shouldInline(field)) {
            return field.type.fields;
        }
        return [field];
    });

    const inlinedFieldsNames = inlinedFields.map(arg => arg.name);
    const duplicates = inlinedFieldsNames.filter((e, i, a) => a.indexOf(e) !== i);
    const uniqueDuplicates = [...new Set(duplicates)];
    const hasConflictingNames = uniqueDuplicates.length > 0;

    if (hasConflictingNames) {
        throw new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES, {
            conflictingAttributes: uniqueDuplicates,
        });
    }

    return hasConflictingNames ? node : structTypeNode(inlinedFields);
};
