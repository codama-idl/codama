import {
    bytesTypeNode,
    bytesValueNode,
    fieldDiscriminatorNode,
    fixedSizeTypeNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { instructionNodeFromAnchorV00 } from '../../src';

test('it creates instruction nodes', () => {
    const node = instructionNodeFromAnchorV00({
        accounts: [{ isMut: true, isSigner: false, name: 'mint' }],
        args: [{ name: 'amount', type: 'u8' }],
        name: 'mintTokens',
    });

    expect(node).toEqual(
        instructionNode({
            accounts: [instructionAccountNode({ isSigner: false, isWritable: true, name: 'mint' })],
            arguments: [instructionArgumentNode({ name: 'amount', type: numberTypeNode('u8') })],
            name: 'mintTokens',
        }),
    );
});

test('it creates instruction nodes with anchor discriminators', () => {
    const node = instructionNodeFromAnchorV00(
        {
            accounts: [],
            args: [],
            name: 'myInstruction',
        },
        'anchor',
    );

    expect(node).toEqual(
        instructionNode({
            arguments: [
                instructionArgumentNode({
                    defaultValue: bytesValueNode('base16', 'c3f1b80e7f9b4435'),
                    defaultValueStrategy: 'omitted',
                    name: 'discriminator',
                    type: fixedSizeTypeNode(bytesTypeNode(), 8),
                }),
            ],
            discriminators: [fieldDiscriminatorNode('discriminator')],
            name: 'myInstruction',
        }),
    );
});
