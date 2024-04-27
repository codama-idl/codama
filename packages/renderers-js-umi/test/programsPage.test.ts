import { programNode } from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import test from 'ava';

import { getRenderMapVisitor } from '../src/index.js';
import { renderMapContains, renderMapContainsImports } from './_setup.js';

test('it renders the program address constant', async t => {
    // Given the following program.
    const node = programNode({
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following program address constant.
    await renderMapContains(t, renderMap, 'programs/splToken.ts', [
        "export const SPL_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as PublicKey<'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'>;",
    ]);

    // And we expect the following imports.
    await renderMapContainsImports(t, renderMap, 'programs/splToken.ts', {
        '@metaplex-foundation/umi': ['PublicKey'],
    });
});
