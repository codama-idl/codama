import { instructionArgumentNode, instructionNode, programNode, stringTypeNode } from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { codeContains } from './_setup';

test('it renders a public instruction data struct', () => {
    // Given the following program with 1 instruction.
    const node = programNode({
        instructions: [instructionNode({ name: 'mintTokens' })],
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following pub struct.
    codeContains(renderMap.get('instructions/mint_tokens.rs'), [`pub struct MintTokensInstructionData`, `pub fn new(`]);
});

test('it renders an instruction with a remainder str', () => {
    // Given the following program with 1 instruction.
    const node = programNode({
        instructions: [
            instructionNode({
                arguments: [
                    instructionArgumentNode({
                        name: 'memo',
                        type: stringTypeNode('utf8'),
                    }),
                ],
                name: 'addMemo',
            }),
        ],
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following pub struct.
    codeContains(renderMap.get('instructions/add_memo.rs'), [
        `use kaigan::types::RemainderStr`,
        `pub memo: RemainderStr`,
    ]);
});
