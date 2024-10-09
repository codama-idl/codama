import { programNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { renderMapContains, renderMapContainsImports } from './_setup';

test('it renders the program address constant', async () => {
    // Given the following program.
    const node = programNode({
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following program address constant.
    await renderMapContains(renderMap, 'programs/splToken.ts', [
        "export const SPL_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as PublicKey<'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'>;",
    ]);

    // And we expect the following imports.
    await renderMapContainsImports(renderMap, 'programs/splToken.ts', {
        '@metaplex-foundation/umi': ['PublicKey'],
    });
});
