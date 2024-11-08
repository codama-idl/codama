import {
    accountNode,
    bytesTypeNode,
    camelCase,
    constantPdaSeedNode,
    constantPdaSeedNodeFromString,
    fixedSizeTypeNode,
    numberTypeNode,
    numberValueNode,
    pdaLinkNode,
    pdaNode,
    programNode,
    publicKeyTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { codeContains } from './_setup';

test('it renders a byte array seed used on an account', () => {
    // Given the following program with 1 account and 1 pda with a byte array as seeds.
    const node = programNode({
        accounts: [
            accountNode({
                name: 'testAccount',
                pda: pdaLinkNode('testPda'),
            }),
        ],
        name: 'splToken',
        pdas: [
            // Byte array seeds.
            pdaNode({
                name: 'testPda',
                seeds: [variablePdaSeedNode('byteArraySeed', fixedSizeTypeNode(bytesTypeNode(), 32))],
            }),
        ],
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following identifier and reference to the byte array
    // as a parameters to be rendered.
    codeContains(renderMap.get('accounts/test_account.rs'), [`byte_array_seed: [u8; 32],`, `&byte_array_seed,`]);
});

test('it renders an empty array of seeds for seedless PDAs', () => {
    // Given the following program with 1 account and 1 pda with empty seeds.
    const node = programNode({
        accounts: [
            accountNode({
                discriminators: [],
                name: 'testAccount',
                pda: pdaLinkNode('testPda'),
            }),
        ],
        name: 'splToken',
        pdas: [
            // Empty array seeds.
            pdaNode({ name: 'testPda', seeds: [] }),
        ],
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following identifier and reference to the byte array
    // as a parameters to be rendered.
    codeContains(renderMap.get('accounts/test_account.rs'), [/pub fn find_pda\(/, /&\[\s*\]/]);
});

test('it renders constant PDA seeds as prefix consts', () => {
    // Given the following PDA node attached to an account.
    const node = programNode({
        accounts: [accountNode({ discriminators: [], name: 'testAccount', pda: pdaLinkNode('testPda') })],
        name: 'myProgram',
        pdas: [
            pdaNode({
                name: 'testPda',
                seeds: [
                    constantPdaSeedNodeFromString('utf8', 'myPrefix'),
                    variablePdaSeedNode('myAccount', publicKeyTypeNode()),
                    constantPdaSeedNode(numberTypeNode('u64'), numberValueNode(42)),
                ],
            }),
        ],
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following const helpers for constant seeds.
    codeContains(renderMap.get('accounts/test_account.rs'), [
        '///   0. `TestAccount::PREFIX.0`',
        '///   1. my_account (`Pubkey`)',
        '///   2. `TestAccount::PREFIX.1`',
        /pub const PREFIX: \(\s*&'static \[u8\],\s*&'static \[u8\],\s*\) = \(\s*"myPrefix"\.as_bytes\(\),\s*42\.as_bytes\(\),\s*\)/,
    ]);
});

test('it renders anchor traits impl', () => {
    // Given the following account.
    const node = programNode({
        accounts: [
            accountNode({
                discriminators: [
                    {
                        kind: 'fieldDiscriminatorNode',
                        name: camelCase('discriminator'),
                        offset: 0,
                    },
                ],
                name: 'testAccount',
                pda: pdaLinkNode('testPda'),
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following Anchor traits impl.
    codeContains(renderMap.get('accounts/test_account.rs'), [
        '#[cfg(feature = "anchor")]',
        'impl anchor_lang::AccountDeserialize for TestAccount',
        'impl anchor_lang::AccountSerialize for TestAccount {}',
        'impl anchor_lang::Owner for TestAccount',
    ]);
});

test('it renders fetch functions', () => {
    // Given the following account.
    const node = programNode({
        accounts: [
            accountNode({
                discriminators: [
                    {
                        kind: 'fieldDiscriminatorNode',
                        name: camelCase('discriminator'),
                        offset: 0,
                    },
                ],
                name: 'testAccount',
                pda: pdaLinkNode('testPda'),
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following fetch functions to be rendered.
    codeContains(renderMap.get('accounts/test_account.rs'), [
        'pub fn fetch_test_account',
        'pub fn fetch_maybe_test_account',
        'pub fn fetch_all_test_account',
        'pub fn fetch_all_maybe_test_account',
    ]);
});
