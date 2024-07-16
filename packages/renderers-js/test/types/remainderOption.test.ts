import { definedTypeNode, publicKeyTypeNode, remainderOptionTypeNode } from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains, renderMapContainsImports } from '../_setup';

test('it renders remainder option codecs', () => {
    // Given the following node.
    const node = definedTypeNode({
        name: 'myType',
        type: remainderOptionTypeNode(publicKeyTypeNode()),
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    renderMapContains(renderMap, 'types/myType.ts', [
        'export type MyType = Option<Address>',
        'export type MyTypeArgs = OptionOrNullable<Address>',
        'getOptionEncoder( getAddressEncoder(), { prefix: null } )',
        'getOptionDecoder( getAddressDecoder(), { prefix: null } )',
    ]);

    // And we expect the following codec imports.
    renderMapContainsImports(renderMap, 'types/myType.ts', {
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
