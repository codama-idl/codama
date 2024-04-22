import {
    assertIsNode,
    fieldDiscriminatorNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    TypeNode,
    ValueNode,
} from '@kinobi-so/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor } from '@kinobi-so/visitors-core';

type Discriminator = {
    /** @defaultValue `[]` */
    docs?: string[];
    /** @defaultValue `"discriminator"` */
    name?: string;
    /** @defaultValue `"omitted"` */
    strategy?: 'omitted' | 'optional';
    /** @defaultValue `numberTypeNode('u8')` */
    type?: TypeNode;
    value: ValueNode;
};

export function setInstructionDiscriminatorsVisitor(map: Record<string, Discriminator>) {
    return bottomUpTransformerVisitor(
        Object.entries(map).map(
            ([selector, discriminator]): BottomUpNodeTransformerWithSelector => ({
                select: ['[instructionNode]', selector],
                transform: node => {
                    assertIsNode(node, 'instructionNode');
                    const discriminatorArgument = instructionArgumentNode({
                        defaultValue: discriminator.value,
                        defaultValueStrategy: discriminator.strategy ?? 'omitted',
                        docs: discriminator.docs ?? [],
                        name: discriminator.name ?? 'discriminator',
                        type: discriminator.type ?? numberTypeNode('u8'),
                    });

                    return instructionNode({
                        ...node,
                        arguments: [discriminatorArgument, ...node.arguments],
                        discriminators: [
                            fieldDiscriminatorNode(discriminator.name ?? 'discriminator'),
                            ...(node.discriminators ?? []),
                        ],
                    });
                },
            }),
        ),
    );
}
