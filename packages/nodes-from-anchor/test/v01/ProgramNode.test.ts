import {
    accountNode,
    bytesTypeNode,
    constantPdaSeedNode,
    definedTypeNode,
    errorNode,
    fieldDiscriminatorNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    pdaNode,
    programNode,
    publicKeyTypeNode,
    structFieldTypeNode,
    structTypeNode,
    variablePdaSeedNode,
} from '@kinobi-so/nodes';
import test from 'ava';

import { getAnchorDiscriminatorV01, programNodeFromAnchorV01 } from '../../src/index.js';

test('it creates program nodes', t => {
    const node = programNodeFromAnchorV01({
        accounts: [{ discriminator: [246, 28, 6, 87, 251, 45, 50, 42], name: 'MyAccount' }],
        address: '1111',
        errors: [{ code: 42, msg: 'my error message', name: 'myError' }],
        instructions: [
            {
                accounts: [
                    {
                        name: 'authority',
                        pda: {
                            seeds: [
                                { kind: 'const', value: [42, 31, 29] },
                                { kind: 'account', path: 'owner' },
                            ],
                        },
                    },
                ],
                args: [],
                discriminator: [246, 28, 6, 87, 251, 45, 50, 42],
                name: 'myInstruction',
            },
        ],
        metadata: { name: 'myProgram', spec: '0.1.0', version: '1.2.3' },
        types: [{ name: 'MyAccount', type: { fields: [], kind: 'struct' } }],
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
            definedTypes: [definedTypeNode({ name: 'myAccount', type: structTypeNode([]) })],
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
                    accounts: [
                        instructionAccountNode({
                            isSigner: false,
                            isWritable: false,
                            name: 'authority',
                        }),
                    ],
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
            pdas: [
                pdaNode({
                    name: 'authority',
                    seeds: [
                        constantPdaSeedNode(bytesTypeNode(), getAnchorDiscriminatorV01([42, 31, 29])),
                        variablePdaSeedNode('owner', publicKeyTypeNode()),
                    ],
                }),
            ],
            publicKey: '1111',
            version: '1.2.3',
        }),
    );
});
