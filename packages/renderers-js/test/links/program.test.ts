import {
    instructionAccountNode,
    instructionNode,
    pdaNode,
    programLinkNode,
    programNode,
    rootNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains, renderMapContainsImports } from '../_setup';

test('it imports constants from the linked program', async () => {
    // Given the following node.
    const node = rootNode(
        programNode({
            instructions: [
                instructionNode({
                    accounts: [
                        instructionAccountNode({
                            defaultValue: programLinkNode('someOtherProgram'),
                            isSigner: false,
                            isWritable: false,
                            name: 'otherProgram',
                        }),
                    ],
                    name: 'myInstruction',
                }),
            ],
            name: 'myProgram',
            pdas: [pdaNode({ name: 'counter', seeds: [] })],
            publicKey: '1111',
        }),
        [programNode({ name: 'someOtherProgram', publicKey: '2222' })],
    );

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following to be exported.
    await renderMapContains(renderMap, 'instructions/myInstruction.ts', ['SOME_OTHER_PROGRAM_PROGRAM_ADDRESS']);

    // And we expect the following imports.
    await renderMapContainsImports(renderMap, 'instructions/myInstruction.ts', {
        '../programs': ['SOME_OTHER_PROGRAM_PROGRAM_ADDRESS'],
    });
});

test('it can override the import of a linked account', async () => {
    // Given the following node.
    const node = rootNode(
        programNode({
            instructions: [
                instructionNode({
                    accounts: [
                        instructionAccountNode({
                            defaultValue: programLinkNode('someOtherProgram'),
                            isSigner: false,
                            isWritable: false,
                            name: 'otherProgram',
                        }),
                    ],
                    name: 'myInstruction',
                }),
            ],
            name: 'myProgram',
            pdas: [pdaNode({ name: 'counter', seeds: [] })],
            publicKey: '1111',
        }),
        [programNode({ name: 'someOtherProgram', publicKey: '2222' })],
    );

    // When we render it using a custom import.
    const renderMap = visit(
        node,
        getRenderMapVisitor({
            linkOverrides: {
                programs: { someOtherProgram: 'hooked' },
            },
        }),
    );

    // Then we expect the following to be exported.
    await renderMapContains(renderMap, 'instructions/myInstruction.ts', ['SOME_OTHER_PROGRAM_PROGRAM_ADDRESS']);

    // And we expect the imports to be overridden.
    await renderMapContainsImports(renderMap, 'instructions/myInstruction.ts', {
        '../../hooked': ['SOME_OTHER_PROGRAM_PROGRAM_ADDRESS'],
    });
});
