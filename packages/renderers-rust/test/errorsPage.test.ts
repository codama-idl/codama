import { errorNode, programNode } from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { codeContains } from './_setup';

test('it renders codes for errors', () => {
    // Given the following program with 2 errors.
    const node = programNode({
        name: 'splToken',
        errors: [
            errorNode({
                code: 6000,
                name: 'InvalidInstruction',
                message: 'Invalid instruction',
            }),
            errorNode({
                code: 7000,
                name: 'InvalidProgram',
                message: 'Invalid program',
            }),
        ],
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    console.log(renderMap.get('errors/spl_token.rs'));

    // Then we expect the following errors with codes.
    codeContains(renderMap.get('errors/spl_token.rs'), [`InvalidInstruction = 0x1770,`, `InvalidProgram = 0x1B58,`]);
});
