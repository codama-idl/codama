import { definedTypeNode, publicKeyTypeNode, remainderOptionTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains, renderMapContainsImports } from '../_setup';

test('it renders remainder option codecs', async () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: remainderOptionTypeNode(publicKeyTypeNode()),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/myType.ts', [
        'export type MyType = Option<Address>',
        'export type MyTypeArgs = OptionOrNullable<Address>',
        'getOptionEncoder( getAddressEncoder(), { prefix: null } )',
        'getOptionDecoder( getAddressDecoder(), { prefix: null } )',
    ]);

    // And we expect the following codec imports.
    await renderMapContainsImports(renderMap, 'types/myType.ts', {
        '@solana/web3.js': [
            'getOptionEncoder',
            'getOptionDecoder',
            'getAddressEncoder',
            'getAddressDecoder',
            'Option',
            'OptionOrNullable',
        ],
    });
});
