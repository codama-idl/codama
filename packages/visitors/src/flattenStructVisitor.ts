import {
    assertIsNode,
    camelCase,
    isNode,
    Node,
    StructFieldTypeNode,
    StructTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor } from '@kinobi-so/visitors-core';

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
        // TODO: logWarn
        // logWarn(
        //     `Cound not flatten the attributes of a struct ` +
        //         `since this would cause the following attributes ` +
        //         `to conflict [${uniqueDuplicates.join(', ')}].` +
        //         'You may want to rename the conflicting attributes.',
        // );
    }

    return hasConflictingNames ? node : structTypeNode(inlinedFields);
};
