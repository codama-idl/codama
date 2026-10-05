import {
    accountNode,
    constantNode,
    definedTypeNode,
    errorNode,
    eventNode,
    floatValueNode,
    instructionAccountNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    pdaLinkNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    programLinkNode,
    programNode,
    rootNode,
    structTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { describe, expect, test } from 'vitest';

import type { v1 } from '../../src';
import { programNodeFromV1, upgradeV1ToV2 } from '../../src/v1ToV2';

describe('programs', () => {
    test('it converts programs and everything they define, dropping their origin', () => {
        const root = {
            kind: 'rootNode',
            program: {
                accounts: [{ data: { fields: [], kind: 'structTypeNode' }, kind: 'accountNode', name: 'config' }],
                constants: [
                    {
                        kind: 'constantNode',
                        name: 'max',
                        type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                        value: { kind: 'numberValueNode', number: 9 },
                    },
                ],
                definedTypes: [
                    {
                        kind: 'definedTypeNode',
                        name: 'amount',
                        type: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
                    },
                ],
                docs: ['My program.'],
                errors: [{ code: 1, kind: 'errorNode', message: 'Oops', name: 'oops' }],
                events: [{ data: { fields: [], kind: 'structTypeNode' }, kind: 'eventNode', name: 'updated' }],
                instructions: [{ kind: 'instructionNode', name: 'noop', optionalAccountStrategy: 'programId' }],
                kind: 'programNode',
                name: 'myProgram',
                origin: 'anchor',
                pdas: [{ kind: 'pdaNode', name: 'vault', seeds: [] }],
                publicKey: '1111',
                version: '1.2.3',
            },
            standard: 'codama',
            version: '1.9.0',
        } as unknown as v1.RootNode;
        expect(programNodeFromV1([root, root.program])).toStrictEqual(
            programNode({
                accounts: [accountNode({ data: structTypeNode([]), identifier: 'config' })],
                constants: [constantNode('max', integerTypeNode('u8'), integerValueNode('9'))],
                definedTypes: [definedTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })],
                docs: 'My program.',
                errors: [errorNode({ code: 1, identifier: 'oops', message: 'Oops' })],
                events: [eventNode({ data: structTypeNode([]), identifier: 'updated' })],
                identifier: 'myProgram',
                instructions: [instructionNode({ identifier: 'noop' })],
                pdas: [pdaNode({ identifier: 'vault' })],
                publicKey: '1111',
                version: '1.2.3',
            }),
        );
    });
});

describe('roots', () => {
    test('it converts roots and their additional programs, stamped with the first v2 version', () => {
        // Given an instruction of the main program deriving a PDA of another program.
        const root = {
            additionalPrograms: [
                {
                    kind: 'programNode',
                    name: 'other',
                    pdas: [
                        {
                            kind: 'pdaNode',
                            name: 'vault',
                            seeds: [
                                {
                                    kind: 'variablePdaSeedNode',
                                    name: 'ratio',
                                    type: { endian: 'le', format: 'f32', kind: 'numberTypeNode' },
                                },
                            ],
                        },
                    ],
                    publicKey: '2222',
                    version: '1.0.0',
                },
            ],
            kind: 'rootNode',
            program: {
                instructions: [
                    {
                        accounts: [
                            {
                                defaultValue: {
                                    kind: 'pdaValueNode',
                                    pda: {
                                        kind: 'pdaLinkNode',
                                        name: 'vault',
                                        program: { kind: 'programLinkNode', name: 'other' },
                                    },
                                    seeds: [
                                        {
                                            kind: 'pdaSeedValueNode',
                                            name: 'ratio',
                                            value: { kind: 'numberValueNode', number: 1 },
                                        },
                                    ],
                                },
                                isOptional: false,
                                isSigner: false,
                                isWritable: false,
                                kind: 'instructionAccountNode',
                                name: 'vault',
                            },
                        ],
                        kind: 'instructionNode',
                        name: 'open',
                        optionalAccountStrategy: 'programId',
                    },
                ],
                kind: 'programNode',
                name: 'main',
                publicKey: '1111',
                version: '1.0.0',
            },
            standard: 'codama',
            version: '1.9.0',
        } as unknown as v1.RootNode;

        // Then the PDA seed values are typed by the PDA of the other program.
        expect(upgradeV1ToV2(root)).toStrictEqual({
            ...rootNode(
                programNode({
                    identifier: 'main',
                    instructions: [
                        instructionNode({
                            accounts: [
                                instructionAccountNode({
                                    defaultValue: pdaValueNode(
                                        pdaLinkNode('vault', { program: programLinkNode('other') }),
                                        {
                                            seeds: [pdaSeedValueNode('ratio', floatValueNode('1'))],
                                        },
                                    ),
                                    identifier: 'vault',
                                    isSigner: false,
                                    isWritable: false,
                                }),
                            ],
                            identifier: 'open',
                        }),
                    ],
                    publicKey: '1111',
                    version: '1.0.0',
                }),
                {
                    additionalPrograms: [
                        programNode({
                            identifier: 'other',
                            pdas: [
                                pdaNode({
                                    identifier: 'vault',
                                    seeds: [
                                        variablePdaSeedNode('ratio', {
                                            endian: 'le',
                                            format: 'f32',
                                            kind: 'floatTypeNode',
                                        }),
                                    ],
                                }),
                            ],
                            publicKey: '2222',
                            version: '1.0.0',
                        }),
                    ],
                },
            ),
            version: '2.0.0',
        });
    });
});
