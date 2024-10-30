import { CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_ARGUMENT_NOT_FOUND, CodamaError } from '@codama/errors';
import {
    assertIsNode,
    camelCase,
    EnumTypeNode,
    instructionArgumentNode,
    InstructionNode,
    instructionNode,
    isNode,
    numberTypeNode,
    numberValueNode,
} from '@codama/nodes';
import {
    BottomUpNodeTransformerWithSelector,
    bottomUpTransformerVisitor,
    LinkableDictionary,
    NodeStack,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
    recordNodeStackVisitor,
} from '@codama/visitors-core';

import { flattenInstructionArguments } from './flattenInstructionDataArgumentsVisitor';

export function createSubInstructionsFromEnumArgsVisitor(map: Record<string, string>) {
    const linkables = new LinkableDictionary();
    const stack = new NodeStack();

    const visitor = bottomUpTransformerVisitor(
        Object.entries(map).map(
            ([selector, argNameInput]): BottomUpNodeTransformerWithSelector => ({
                select: ['[instructionNode]', selector],
                transform: node => {
                    assertIsNode(node, 'instructionNode');

                    const argFields = node.arguments;
                    const argName = camelCase(argNameInput);
                    const argFieldIndex = argFields.findIndex(field => field.name === argName);
                    const argField = argFieldIndex >= 0 ? argFields[argFieldIndex] : null;
                    if (!argField) {
                        throw new CodamaError(CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_ARGUMENT_NOT_FOUND, {
                            argumentName: argName,
                            instruction: node,
                            instructionName: node.name,
                        });
                    }

                    let argType: EnumTypeNode;
                    if (isNode(argField.type, 'enumTypeNode')) {
                        argType = argField.type;
                    } else if (isNode(argField.type, 'definedTypeLinkNode') && linkables.has(argField.type, stack)) {
                        const linkedType = linkables.get(argField.type, stack)?.type ?? null;
                        assertIsNode(linkedType, 'enumTypeNode');
                        argType = linkedType;
                    } else {
                        throw new CodamaError(CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_ARGUMENT_NOT_FOUND, {
                            argumentName: argName,
                            instruction: node,
                            instructionName: node.name,
                        });
                    }

                    const subInstructions = argType.variants.map((variant, index): InstructionNode => {
                        const subName = camelCase(`${node.name} ${variant.name}`);
                        const subFields = argFields.slice(0, argFieldIndex);
                        subFields.push(
                            instructionArgumentNode({
                                defaultValue: numberValueNode(index),
                                defaultValueStrategy: 'omitted',
                                name: `${subName}Discriminator`,
                                type: numberTypeNode('u8'),
                            }),
                        );
                        if (isNode(variant, 'enumStructVariantTypeNode')) {
                            subFields.push(
                                instructionArgumentNode({
                                    ...argField,
                                    type: variant.struct,
                                }),
                            );
                        } else if (isNode(variant, 'enumTupleVariantTypeNode')) {
                            subFields.push(
                                instructionArgumentNode({
                                    ...argField,
                                    type: variant.tuple,
                                }),
                            );
                        }
                        subFields.push(...argFields.slice(argFieldIndex + 1));

                        return instructionNode({
                            ...node,
                            arguments: flattenInstructionArguments(subFields),
                            name: subName,
                        });
                    });

                    return instructionNode({
                        ...node,
                        subInstructions: [...(node.subInstructions ?? []), ...subInstructions],
                    });
                },
            }),
        ),
    );

    return pipe(
        visitor,
        v => recordNodeStackVisitor(v, stack),
        v => recordLinkablesOnFirstVisitVisitor(v, linkables),
    );
}
