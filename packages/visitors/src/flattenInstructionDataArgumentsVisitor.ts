import {
    assertIsNode,
    camelCase,
    InstructionArgumentNode,
    instructionArgumentNode,
    instructionNode,
    isNode,
} from '@kinobi-so/nodes';
import { bottomUpTransformerVisitor } from '@kinobi-so/visitors-core';

export function flattenInstructionDataArgumentsVisitor() {
    return bottomUpTransformerVisitor([
        {
            select: '[instructionNode]',
            transform: instruction => {
                assertIsNode(instruction, 'instructionNode');
                return instructionNode({
                    ...instruction,
                    arguments: flattenInstructionArguments(instruction.arguments),
                });
            },
        },
    ]);
}

export type FlattenInstructionArgumentsConfig = string[] | '*';

export const flattenInstructionArguments = (
    nodes: InstructionArgumentNode[],
    options: FlattenInstructionArgumentsConfig = '*',
): InstructionArgumentNode[] => {
    const camelCaseOptions = options === '*' ? options : options.map(camelCase);
    const shouldInline = (node: InstructionArgumentNode): boolean =>
        options === '*' || camelCaseOptions.includes(camelCase(node.name));
    const inlinedArguments = nodes.flatMap(node => {
        if (isNode(node.type, 'structTypeNode') && shouldInline(node)) {
            return node.type.fields.map(field => instructionArgumentNode({ ...field }));
        }
        return node;
    });

    const inlinedFieldsNames = inlinedArguments.map(arg => arg.name);
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

    return hasConflictingNames ? nodes : inlinedArguments;
};
