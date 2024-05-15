import {
    argumentValueNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    programNode,
    resolverValueNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { codeContains, codeDoesNotContain, renderMapContains } from './_setup';

test('it renders extra arguments that default on each other', async () => {
    // Given the following instruction with two extra arguments
    // such that one defaults to the other.
    const node = programNode({
        instructions: [
            instructionNode({
                extraArguments: [
                    instructionArgumentNode({
                        defaultValue: argumentValueNode('bar'),
                        name: 'foo',
                        type: numberTypeNode('u64'),
                    }),
                    instructionArgumentNode({
                        name: 'bar',
                        type: numberTypeNode('u64'),
                    }),
                ],
                name: 'create',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following code to be rendered.
    await renderMapContains(renderMap, 'instructions/create.ts', [
        'const args = { ...input }',
        'if (!args.foo) { args.foo = expectSome(args.bar); }',
    ]);
});

test('it only renders the args variable on the async function if the sync function does not need it', async () => {
    // Given the following instruction with an async resolver and an extra argument.
    const node = programNode({
        instructions: [
            instructionNode({
                extraArguments: [
                    instructionArgumentNode({
                        defaultValue: resolverValueNode('myAsyncResolver'),
                        name: 'foo',
                        type: numberTypeNode('u64'),
                    }),
                ],
                name: 'create',
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor({ asyncResolvers: ['myAsyncResolver'] }));

    // And split the async and sync functions.
    const [asyncFunction, syncFunction] = renderMap
        .get('instructions/create.ts')
        .split(/export\s+function\s+getCreateInstruction/);

    // Then we expect only the async function to contain the args variable.
    await codeContains(asyncFunction, ['// Original args.', 'const args = { ...input }']);
    await codeDoesNotContain(syncFunction, ['// Original args.', 'const args = { ...input }']);
});
