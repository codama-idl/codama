import {
    accountValueNode,
    constantPdaSeedNodeFromBytes,
    hex,
    instructionAccountNode,
    instructionArgumentNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    publicKeyTypeNode,
    numberTypeNode,
    publicKeyValueNode,
    variablePdaSeedNode,
    argumentValueNode,
} from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { instructionAccountNodeFromAnchorV01, instructionAccountNodesFromAnchorV01 } from '../../src';

test('it creates instruction account nodes', () => {
    const node = instructionAccountNodeFromAnchorV01([], [], {
        docs: ['my docs'],
        name: 'MyInstructionAccount',
        optional: true,
        signer: false,
        writable: true,
    });

    expect(node).toEqual(
        instructionAccountNode({
            docs: ['my docs'],
            isOptional: true,
            isSigner: false,
            isWritable: true,
            name: 'myInstructionAccount',
        }),
    );
});

test('it flattens nested instruction accounts', () => {
    const nodes = instructionAccountNodesFromAnchorV01(
        [],
        [
            instructionArgumentNode({
                name: 'amount',
                type: numberTypeNode('u8'),
            }),
        ],
        [
            { name: 'accountA', signer: false, writable: false },
            {
                accounts: [
                    {
                        name: 'account_b',
                        signer: false,
                        writable: true,
                    },
                    {
                        name: 'account_c',
                        pda: {
                            seeds: [
                                {
                                    kind: 'const',
                                    value: [0, 1, 2, 3],
                                },
                                {
                                    kind: 'account',
                                    path: 'account_b',
                                },
                                {
                                    kind: 'arg',
                                    path: 'amount',
                                },
                            ],
                        },
                        signer: true,
                        writable: false,
                    },
                    {
                        address: '11111111111111111111111111111111',
                        name: 'system_program',
                    },
                ],
                name: 'nested',
            },
            { name: 'account_d', signer: true, writable: true },
        ],
    );

    expect(nodes).toEqual([
        instructionAccountNode({ isSigner: false, isWritable: false, name: 'accountA' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'accountB' }),
        instructionAccountNode({
            defaultValue: pdaValueNode(
                pdaNode({
                    name: 'accountC',
                    seeds: [
                        constantPdaSeedNodeFromBytes('base16', hex(new Uint8Array([0, 1, 2, 3]))),
                        variablePdaSeedNode('accountB', publicKeyTypeNode()),
                        variablePdaSeedNode('amount', numberTypeNode('u8')),
                    ],
                }),
                [
                    pdaSeedValueNode('accountB', accountValueNode('accountB')),
                    pdaSeedValueNode('amount', argumentValueNode('amount')),
                ],
            ),
            isSigner: true,
            isWritable: false,
            name: 'accountC',
        }),
        instructionAccountNode({
            defaultValue: publicKeyValueNode('11111111111111111111111111111111', 'systemProgram'),
            isSigner: false,
            isWritable: false,
            name: 'systemProgram',
        }),
        instructionAccountNode({ isSigner: true, isWritable: true, name: 'accountD' }),
    ]);
});
