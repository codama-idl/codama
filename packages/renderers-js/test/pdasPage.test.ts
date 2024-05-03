import { pdaNode, programNode } from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { renderMapContains } from './_setup';

test('it renders an empty array seed used on a pda', async () => {
    // Given the following program with 1 account and 1 pda with empty seeds.
    const node = programNode({
        name: 'myProgram',
        pdas: [pdaNode({ name: 'foo', seeds: [] })],
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following PDA function using an empty seeds array to derive the address.
    await renderMapContains(renderMap, 'pdas/foo.ts', [
        'export async function findFooPda',
        'getProgramDerivedAddress({ programAddress, seeds: [] })',
    ]);
});
