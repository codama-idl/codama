import { errorNode, programNode } from '@codama/nodes';
import { getFromRenderMap } from '@codama/renderers-core';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { codeContains } from './_setup';

test('it renders codes for errors', () => {
    // Given the following program with 2 errors.
    const node = programNode({
        errors: [
            errorNode({
                code: 6000,
                message: 'Invalid instruction',
                name: 'InvalidInstruction',
            }),
            errorNode({
                code: 7000,
                message: 'Invalid program',
                name: 'InvalidProgram',
            }),
        ],
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following errors with codes.
    codeContains(getFromRenderMap(renderMap, 'errors/spl_token.rs'), [
        `InvalidInstruction = 0x1770,`,
        `InvalidProgram = 0x1B58,`,
    ]);
});
