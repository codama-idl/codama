import { CODAMA_ERROR__VISITORS__CANNOT_SET_INSTRUCTION_DISCRIMINATOR, CodamaError } from '@codama/errors';
import {
    addTypeNodeTransforms,
    assertIsNode,
    constantDiscriminatorNode,
    constantValueNode,
    DiscriminatorNode,
    fieldDiscriminatorNode,
    hiddenPrefixTransformNode,
    InstructionNode,
    instructionNode,
    integerTypeNode,
    isNode,
    sizeDiscriminatorNode,
    structFieldTypeNode,
    structTypeNode,
    TextNode,
    TypeNode,
    ValueNode,
} from '@codama/nodes';
import {
    BottomUpNodeTransformerWithSelector,
    bottomUpTransformerVisitor,
    getByteSizeVisitor,
    LinkableDictionary,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
    visit,
} from '@codama/visitors-core';

import { assertValidUpdateKeys } from './updateHelpers';

export type InstructionDiscriminator = {
    /** Only used when the discriminator is added as a data field. */
    docs?: TextNode | string;
    /**
     * The identifier of the discriminator field, when added as a data field.
     * @defaultValue `"discriminator"`
     */
    identifier?: string;
    /**
     * The default value strategy of the discriminator field. Only `omitted`
     * is supported when the discriminator is added as a hidden prefix.
     * @defaultValue `"omitted"`
     */
    strategy?: 'omitted' | 'optional';
    /**
     * The type of the discriminator, which must have a fixed size.
     * @defaultValue `integerTypeNode('u8')`
     */
    type?: TypeNode;
    /** The value of the discriminator. */
    value: ValueNode;
};

const DISCRIMINATOR_KEYS = ['docs', 'identifier', 'strategy', 'type', 'value'];

/**
 * Prepend a discriminator to the data of the selected instructions.
 *
 * - When the instruction data is an inline struct without transforms (or
 *   absent), the discriminator is added as its first field, with the given value as
 *   default value, and a `fieldDiscriminatorNode` pointing to it is added.
 * - Otherwise (e.g. a `definedTypeLinkNode` or a struct with transforms,
 *   such as a size prefix), the discriminator is added as
 *   a `hiddenPrefixTransformNode` wrapping the data, leaving any shared
 *   defined type untouched, and a `constantDiscriminatorNode` is added.
 *
 * Since the discriminator is written before the rest of the data, the
 * offsets of existing field and constant discriminators and the size of
 * existing size discriminators are shifted by its size.
 *
 * @throws {CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS} if a
 * discriminator contains an unrecognised key (e.g. `name` instead of
 * `identifier`).
 * @throws {CODAMA_ERROR__VISITORS__CANNOT_SET_INSTRUCTION_DISCRIMINATOR} if
 * the data already has a field with the discriminator's identifier, if the
 * `optional` strategy is used with a hidden prefix, or if the discriminator
 * type does not have a fixed size.
 *
 * @example
 * ```ts
 * setInstructionDiscriminatorsVisitor({
 *     mint: { value: integerValueNode('0') },
 *     transfer: { identifier: 'kind', type: integerTypeNode('u32'), value: integerValueNode('1') },
 * });
 * ```
 */
export function setInstructionDiscriminatorsVisitor(map: Record<string, InstructionDiscriminator>) {
    const linkables = new LinkableDictionary();

    const transformers = Object.entries(map).map(([selector, discriminator]): BottomUpNodeTransformerWithSelector => {
        assertValidUpdateKeys(selector, discriminator, DISCRIMINATOR_KEYS);
        return {
            select: ['[instructionNode]', selector],
            transform: (node, stack) => {
                assertIsNode(node, 'instructionNode');
                const type = discriminator.type ?? integerTypeNode('u8');
                const size = visit(type, getByteSizeVisitor(linkables, { stack: stack.clone() }));
                if (size === null) throw cannotSet(node, 'the discriminator type must have a fixed size');
                const discriminators = shiftDiscriminators(node.discriminators ?? [], size);

                // A field is only at byte 0 of a struct that has no transforms.
                const isPlainStruct = isNode(node.data, 'structTypeNode') && (node.data.transforms ?? []).length === 0;
                if (node.data === undefined || isPlainStruct) {
                    const identifier = discriminator.identifier ?? 'discriminator';
                    const fields = isNode(node.data, 'structTypeNode') ? (node.data.fields ?? []) : [];
                    if (fields.some(field => field.identifier === identifier)) {
                        throw cannotSet(node, `the data already has a field named \`${identifier}\``);
                    }
                    const field = structFieldTypeNode({
                        defaultValue: discriminator.value,
                        defaultValueStrategy: discriminator.strategy ?? 'omitted',
                        docs: discriminator.docs,
                        identifier,
                        type,
                    });
                    return instructionNode({
                        ...node,
                        data: structTypeNode([field, ...fields], { ...node.data }),
                        discriminators: [fieldDiscriminatorNode(identifier), ...discriminators],
                    });
                }

                if (discriminator.strategy === 'optional') {
                    throw cannotSet(
                        node,
                        'the `optional` strategy is not supported when the discriminator is added as a hidden prefix',
                    );
                }
                const constant = constantValueNode(type, discriminator.value);
                return instructionNode({
                    ...node,
                    data: addTypeNodeTransforms(node.data, [hiddenPrefixTransformNode([constant])]),
                    discriminators: [constantDiscriminatorNode(constant, { offset: 0 }), ...discriminators],
                });
            },
        };
    });

    return pipe(bottomUpTransformerVisitor(transformers), v => recordLinkablesOnFirstVisitVisitor(v, linkables));
}

/** Account for bytes prepended to the data in existing discriminators. */
function shiftDiscriminators(discriminators: DiscriminatorNode[], size: number): DiscriminatorNode[] {
    return discriminators.map(discriminator => {
        switch (discriminator.kind) {
            case 'fieldDiscriminatorNode':
                return fieldDiscriminatorNode(discriminator.path, {
                    ...discriminator,
                    offset: discriminator.offset + size,
                });
            case 'constantDiscriminatorNode':
                return constantDiscriminatorNode(discriminator.constant, {
                    ...discriminator,
                    offset: discriminator.offset + size,
                });
            case 'sizeDiscriminatorNode':
                return sizeDiscriminatorNode(discriminator.size + size, { ...discriminator });
        }
    });
}

function cannotSet(instruction: InstructionNode, reason: string): CodamaError {
    return new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_SET_INSTRUCTION_DISCRIMINATOR, {
        instruction,
        instructionName: instruction.identifier,
        reason,
    });
}
