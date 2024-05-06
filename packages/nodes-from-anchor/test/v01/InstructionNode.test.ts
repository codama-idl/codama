import {
    bytesTypeNode,
    fieldDiscriminatorNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
} from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { instructionNodeFromAnchorV01 } from '../../src/index.js';
import { getAnchorDiscriminatorV01 } from '../../src/index.js';

test('it creates instruction nodes', () => {
    const node = instructionNodeFromAnchorV01({
        accounts: [{ name: 'Mint', signer: false, writable: true }],
        args: [{ name: 'amount', type: 'u8' }],
        discriminator: [246, 28, 6, 87, 251, 45, 50, 42],
        name: 'mintTokens',
    });

    expect(node).toEqual(
        instructionNode({
            accounts: [instructionAccountNode({ isSigner: false, isWritable: true, name: 'mint' })],
            arguments: [
                instructionArgumentNode({
                    defaultValue: getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]),
                    defaultValueStrategy: 'omitted',
                    name: 'discriminator',
                    type: bytesTypeNode(),
                }),
                instructionArgumentNode({ name: 'amount', type: numberTypeNode('u8') }),
            ],
            discriminators: [fieldDiscriminatorNode('discriminator')],
            name: 'mintTokens',
        }),
    );
});

test('it creates instruction nodes with anchor discriminators', () => {
    const node = instructionNodeFromAnchorV01({
        accounts: [],
        args: [],
        discriminator: [246, 28, 6, 87, 251, 45, 50, 42],
        name: 'myInstruction',
    });

    expect(node).toEqual(
        instructionNode({
            arguments: [
                instructionArgumentNode({
                    defaultValue: getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]),
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
