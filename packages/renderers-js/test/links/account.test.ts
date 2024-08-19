import { accountLinkNode, accountNode, instructionByteDeltaNode, instructionNode, programNode } from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains, renderMapContainsImports } from '../_setup';

test('it imports functions from the linked account', async () => {
    // Given the following node.
    const node = programNode({
        accounts: [accountNode({ name: 'counter', size: 42 })],
        instructions: [
            instructionNode({
                byteDeltas: [instructionByteDeltaNode(accountLinkNode('counter'))],
                name: 'createCounter',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following to be exported.
    await renderMapContains(renderMap, 'instructions/createCounter.ts', ['getCounterSize()']);

    // And we expect the following imports.
    await renderMapContainsImports(renderMap, 'instructions/createCounter.ts', {
        '../accounts': ['getCounterSize'],
    });
});

test('it can override the import of a linked account', async () => {
    // Given the following node.
    const node = programNode({
        accounts: [accountNode({ name: 'counter', size: 42 })],
        instructions: [
            instructionNode({
                byteDeltas: [instructionByteDeltaNode(accountLinkNode('counter'))],
                name: 'createCounter',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it using a custom import.
    const renderMap = visit(
        node,
        getRenderMapVisitor({
            linkOverrides: {
                accounts: { counter: 'hooked' },
            },
        }),
    );

    // Then we expect the following to be exported.
    await renderMapContains(renderMap, 'instructions/createCounter.ts', ['getCounterSize()']);

    // And we expect the imports to be overridden.
    await renderMapContainsImports(renderMap, 'instructions/createCounter.ts', {
        '../../hooked': ['getCounterSize'],
    });
});
