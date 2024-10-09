import {
    accountValueNode,
    constantPdaSeedNodeFromString,
    instructionAccountNode,
    instructionNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    programNode,
    publicKeyTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { renderMapContains, renderMapContainsImports } from './_setup';

test('it renders instruction accounts with linked PDAs as default value', async () => {
    // Given the following program with a PDA node and an instruction account using it as default value.
    const node = programNode({
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({ isSigner: true, isWritable: false, name: 'authority' }),
                    instructionAccountNode({
                        defaultValue: pdaValueNode('counter', [
                            pdaSeedValueNode('authority', accountValueNode('authority')),
                        ]),
                        isSigner: false,
                        isWritable: false,
                        name: 'counter',
                    }),
                ],
                name: 'increment',
            }),
        ],
        name: 'counter',
        pdas: [
            pdaNode({
                name: 'counter',
                seeds: [
                    constantPdaSeedNodeFromString('utf8', 'counter'),
                    variablePdaSeedNode('authority', publicKeyTypeNode()),
                ],
            }),
        ],
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following default value to be rendered.
    await renderMapContains(renderMap, 'instructions/increment.ts', [
        'if (!resolvedAccounts.counter.value) { ' +
            'resolvedAccounts.counter.value = findCounterPda( context, { authority: expectPublicKey ( resolvedAccounts.authority.value ) } ); ' +
            '}',
    ]);
    await renderMapContainsImports(renderMap, 'instructions/increment.ts', { '../accounts': ['findCounterPda'] });
});

test('it renders instruction accounts with inlined PDAs as default value', async () => {
    // Given the following instruction with an inlined PDA default value.
    const node = programNode({
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({ isSigner: true, isWritable: false, name: 'authority' }),
                    instructionAccountNode({
                        defaultValue: pdaValueNode(
                            pdaNode({
                                name: 'counter',
                                seeds: [
                                    constantPdaSeedNodeFromString('utf8', 'counter'),
                                    variablePdaSeedNode('authority', publicKeyTypeNode()),
                                ],
                            }),
                            [pdaSeedValueNode('authority', accountValueNode('authority'))],
                        ),
                        isSigner: false,
                        isWritable: false,
                        name: 'counter',
                    }),
                ],
                name: 'increment',
            }),
        ],
        name: 'counter',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following default value to be rendered.
    await renderMapContains(renderMap, 'instructions/increment.ts', [
        "context: Pick<Context, 'eddsa' | 'programs'>",
        'if (!resolvedAccounts.counter.value) { ' +
            'resolvedAccounts.counter.value = context.eddsa.findPda( programId, [ ' +
            "  string({ size: 'variable' }).serialize( 'counter' ), " +
            '  publicKeySerializer().serialize( expectPublicKey( resolvedAccounts.authority.value ) ) ' +
            '] ); ' +
            '}',
    ]);
});

test('it renders instruction accounts with inlined PDAs from another program as default value', async () => {
    // Given the following instruction with an inlined PDA default value from another program.
    const node = programNode({
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({ isSigner: true, isWritable: false, name: 'authority' }),
                    instructionAccountNode({
                        defaultValue: pdaValueNode(
                            pdaNode({
                                name: 'counter',
                                programId: '2222',
                                seeds: [
                                    constantPdaSeedNodeFromString('utf8', 'counter'),
                                    variablePdaSeedNode('authority', publicKeyTypeNode()),
                                ],
                            }),
                            [pdaSeedValueNode('authority', accountValueNode('authority'))],
                        ),
                        isSigner: false,
                        isWritable: false,
                        name: 'counter',
                    }),
                ],
                name: 'increment',
            }),
        ],
        name: 'counter',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following default value to be rendered.
    await renderMapContains(renderMap, 'instructions/increment.ts', [
        'if (!resolvedAccounts.counter.value) { ' +
            'resolvedAccounts.counter.value = context.eddsa.findPda( ' +
            "  context.programs.getPublicKey('2222', '2222'), " +
            '  [ ' +
            "    string({ size: 'variable' }).serialize( 'counter' ), " +
            '    publicKeySerializer().serialize( expectPublicKey( resolvedAccounts.authority.value ) ) ' +
            '  ] ' +
            '); ' +
            '}',
    ]);
});
