import {
    definedTypeNode,
    numberTypeNode,
    programNode,
    sizePrefixTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { codeContains } from './_setup';

test('it renders a prefix string on a defined type', () => {
    // Given the following program with 1 defined type using a prefixed size string.
    const node = programNode({
        definedTypes: [
            definedTypeNode({
                name: 'blob',
                type: structTypeNode([
                    structFieldTypeNode({
                        name: 'contentType',
                        type: sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u8')),
                    }),
                ]),
            }),
        ],
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following use and identifier to be rendered.
    codeContains(renderMap.get('types/blob.rs'), [
        `use kaigan::types::U8PrefixString;`,
        `content_type: U8PrefixString,`,
    ]);
});
