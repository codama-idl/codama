import {
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTypeNode,
    numberTypeNode,
    programNode,
    sizePrefixTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../src';
import { codeContains, codeDoesNotContains } from './_setup';
import { getFromRenderMap } from '@codama/renderers-core';

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
    codeContains(getFromRenderMap(renderMap, 'types/blob.rs'), [
        `use kaigan::types::U8PrefixString;`,
        `content_type: U8PrefixString,`,
    ]);
});

test('it renders a scalar enum with Copy derive', () => {
    // Given the following program with 1 defined type using a prefixed size string.
    const node = programNode({
        definedTypes: [
            definedTypeNode({
                name: 'tag',
                type: enumTypeNode([enumEmptyVariantTypeNode('Uninitialized'), enumEmptyVariantTypeNode('Account')]),
            }),
        ],
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following use and identifier to be rendered.
    codeContains(getFromRenderMap(renderMap, 'types/tag.rs'), [`#[derive(`, `Copy`, `pub enum Tag`]);
});

test('it renders a non-scalar enum without Copy derive', () => {
    // Given the following program with 1 defined type using a prefixed size string.
    const node = programNode({
        definedTypes: [
            definedTypeNode({
                name: 'tagWithStruct',
                type: enumTypeNode([
                    enumEmptyVariantTypeNode('Uninitialized'),
                    enumStructVariantTypeNode(
                        'Account',
                        structTypeNode([
                            structFieldTypeNode({
                                name: 'contentType',
                                type: sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u8')),
                            }),
                        ]),
                    ),
                ]),
            }),
        ],
        name: 'splToken',
        publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following use and identifier to be rendered.
    codeContains(getFromRenderMap(renderMap, 'types/tag_with_struct.rs'), [`#[derive(`, `pub enum TagWithStruct`]);
    // And we expect the Copy derive to be missing.
    codeDoesNotContains(getFromRenderMap(renderMap, 'types/tag_with_struct.rs'), `Copy`);
});
