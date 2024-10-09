import {
    instructionAccountNode,
    instructionNode,
    pdaLinkNode,
    pdaNode,
    pdaValueNode,
    programNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains, renderMapContainsImports } from '../_setup';

test('it imports functions from the linked pda', async () => {
    // Given the following node.
    const node = programNode({
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        defaultValue: pdaValueNode(pdaLinkNode('counter')),
                        isSigner: true,
                        isWritable: true,
                        name: 'counter',
                    }),
                ],
                name: 'createCounter',
            }),
        ],
        name: 'myProgram',
        pdas: [pdaNode({ name: 'counter', seeds: [] })],
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following to be exported.
    await renderMapContains(renderMap, 'instructions/createCounter.ts', ['await findCounterPda()']);

    // And we expect the following imports.
    await renderMapContainsImports(renderMap, 'instructions/createCounter.ts', {
        '../pdas': ['findCounterPda'],
    });
});

test('it can override the import of a linked account', async () => {
    // Given the following node.
    const node = programNode({
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        defaultValue: pdaValueNode(pdaLinkNode('counter')),
                        isSigner: true,
                        isWritable: true,
                        name: 'counter',
                    }),
                ],
                name: 'createCounter',
            }),
        ],
        name: 'myProgram',
        pdas: [pdaNode({ name: 'counter', seeds: [] })],
        publicKey: '1111',
    });

    // When we render it using a custom import.
    const renderMap = visit(
        node,
        getRenderMapVisitor({
            linkOverrides: {
                pdas: { counter: 'hooked' },
            },
        }),
    );

    // Then we expect the following to be exported.
    await renderMapContains(renderMap, 'instructions/createCounter.ts', ['await findCounterPda()']);

    // And we expect the imports to be overridden.
    await renderMapContainsImports(renderMap, 'instructions/createCounter.ts', {
        '../../hooked': ['findCounterPda'],
    });
});
