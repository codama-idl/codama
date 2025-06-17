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
import { codeContains } from './_setup';

test('it renders a prefix string on a defined type', async () => {
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
    //console.log(renderMap.get('types/blob.py'));
    await codeContains(renderMap.get('types/blob.py'), [`"contentType" /StringU8,`, `contentType: str`]);
});

test('it renders a scalar enum', async () => {
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
    //codeContains(renderMap.get('types/tag.rs'), [`#[derive(`, `Copy`, `pub enum Tag`]);
    //console.log(renderMap.get('types/tag.py'));
    await codeContains(renderMap.get('types/tag.py'), [`TagKind = typing.Union[\n    Uninitialized,\n    Account,\n]`]);
});

test('it renders a non-scalar enum without', async () => {
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
    //console.log(renderMap.get('types/tagWithStruct.py'));
    await codeContains(renderMap.get('types/tagWithStruct.py'), [
        `class AccountValue(typing.TypedDict):\n    contentType: str`,
        `class AccountValue(typing.TypedDict):
            contentType: str`,
        `return AccountJSON(
            kind="Account",
            value = {
            "contentType":self.value["contentType"]
            }
        )`,
    ]);

    // Then we expect the following use and identifier to be rendered.
    //codeContains(renderMap.get('types/tag_with_struct.rs'), [`#[derive(`, `pub enum TagWithStruct`]);
    // And we expect the Copy derive to be missing.
    //codeDoesNotContains(renderMap.get('types/tag_with_struct.rs'), `Copy`);
});
