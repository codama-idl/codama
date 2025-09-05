import { instructionNode, programNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { codeContains } from './_setup';
import { getFromRenderMap } from '@codama/renderers-core';

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
    codeContains(getFromRenderMap(renderMap, 'instructions/mint_tokens.rs'), [
        `pub struct MintTokensInstructionData`,
        `pub fn new(`,
    ]);
});
