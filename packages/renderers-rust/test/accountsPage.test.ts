import {
    accountNode,
    bytesTypeNode,
    fixedSizeTypeNode,
    pdaLinkNode,
    pdaNode,
    programNode,
    variablePdaSeedNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import test from 'ava';

import { getRenderMapVisitor } from '../src/index.js';
import { codeContains } from './_setup.js';

test('it renders a byte array seed used on an account', t => {
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
    codeContains(t, renderMap.get('accounts/test_account.rs'), [`byte_array_seed: [u8; 32],`, `&byte_array_seed,`]);
});

test('it renders an empty array seed used on an account', t => {
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
    codeContains(t, renderMap.get('accounts/test_account.rs'), [/pub fn find_pda\(/, /&\[\s*\]/]);
});
