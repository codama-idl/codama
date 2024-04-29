import {
    accountNode,
    bytesTypeNode,
    definedTypeNode,
    errorNode,
    fieldDiscriminatorNode,
    instructionArgumentNode,
    instructionNode,
    programNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import { getAnchorDiscriminatorV01, programNodeFromAnchorV01 } from '../../src/index.js';

test('it creates program nodes', t => {
    const node = programNodeFromAnchorV01({
        accounts: [{ discriminator: [246, 28, 6, 87, 251, 45, 50, 42], name: 'MyAccount' }],
        address: '1111',
        errors: [{ code: 42, msg: 'my error message', name: 'myError' }],
        instructions: [
            { accounts: [], args: [], discriminator: [246, 28, 6, 87, 251, 45, 50, 42], name: 'myInstruction' },
        ],
        metadata: { name: 'myProgram', spec: '0.1.0', version: '1.2.3' },
        types: [{ name: 'myType', type: { fields: [], kind: 'struct' } }],
    });

    t.deepEqual(
        node,
        programNode({
            accounts: [
                accountNode({
                    data: structTypeNode([
                        structFieldTypeNode({
                            defaultValue: getAnchorDiscriminatorV01([246, 28, 6, 87, 251, 45, 50, 42]),
                            defaultValueStrategy: 'omitted',
                            name: 'discriminator',
                            type: bytesTypeNode(),
                        }),
                    ]),
                    discriminators: [fieldDiscriminatorNode('discriminator')],
                    name: 'myAccount',
                }),
            ],
            definedTypes: [definedTypeNode({ name: 'myType', type: structTypeNode([]) })],
            errors: [
                errorNode({
                    code: 42,
                    docs: ['myError: my error message'],
                    message: 'my error message',
                    name: 'myError',
                }),
            ],
            instructions: [
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
            ],
            name: 'myProgram',
            origin: 'anchor',
            pdas: [],
            publicKey: '1111',
            version: '1.2.3',
        }),
    );
});
