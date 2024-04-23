import {
    bytesTypeNode,
    bytesValueNode,
    fieldDiscriminatorNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import { instructionNodeFromAnchorV00 } from '../../src/index.js';

test('it creates instruction nodes', t => {
    const node = instructionNodeFromAnchorV00({
        accounts: [{ isMut: true, isSigner: false, name: 'mint' }],
        args: [{ name: 'amount', type: 'u8' }],
        name: 'mintTokens',
    });

    t.deepEqual(
        node,
        instructionNode({
            accounts: [instructionAccountNode({ isSigner: false, isWritable: true, name: 'mint' })],
            arguments: [instructionArgumentNode({ name: 'amount', type: numberTypeNode('u8') })],
            name: 'mintTokens',
        }),
    );
});

test('it creates instruction nodes with anchor discriminators', t => {
    const node = instructionNodeFromAnchorV00(
        {
            accounts: [],
            args: [],
            name: 'myInstruction',
        },
        'anchor',
    );

    t.deepEqual(
        node,
        instructionNode({
            arguments: [
                instructionArgumentNode({
                    defaultValue: bytesValueNode('base16', 'c3f1b80e7f9b4435'),
                    defaultValueStrategy: 'omitted',
                    name: 'discriminator',
                    type: bytesTypeNode(),
                }),
            ],
            discriminators: [fieldDiscriminatorNode('discriminator')],
            name: 'myInstruction',
        }),
    );
});
