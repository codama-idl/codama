import { KINOBI_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES, KinobiError } from '@codama/errors';
import {
    assertIsNode,
    camelCase,
    InstructionArgumentNode,
    instructionArgumentNode,
    instructionNode,
    isNode,
} from '@codama/nodes';
import { bottomUpTransformerVisitor } from '@codama/visitors-core';

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
        throw new KinobiError(KINOBI_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES, {
            conflictingAttributes: uniqueDuplicates,
        });
    }

    return hasConflictingNames ? nodes : inlinedArguments;
};
