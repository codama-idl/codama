import {
    definedTypeLinkNode,
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumTupleVariantTypeNode,
    enumTypeNode,
    enumValueNode,
    fixedSizeTypeNode,
    numberTypeNode,
    programNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains, renderMapContainsImports } from '../_setup';

test('it imports types and functions from the linked type', async () => {
    // Given the following node.
    const node = programNode({
        definedTypes: [
            definedTypeNode({
                name: 'symbol',
                type: fixedSizeTypeNode(stringTypeNode('utf8'), 5),
            }),
            definedTypeNode({
                name: 'metadata',
                type: structTypeNode([
                    structFieldTypeNode({ name: 'identifier', type: definedTypeLinkNode('symbol') }),
                ]),
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/metadata.ts', [
        'export type Metadata = { identifier: Symbol }',
        'export type MetadataArgs = { identifier: SymbolArgs }',
        'getSymbolEncoder()',
        'getSymbolDecoder()',
    ]);

    // And we expect the following imports.
    await renderMapContainsImports(renderMap, 'types/metadata.ts', {
        '.': ['Symbol', 'SymbolArgs', 'getSymbolEncoder', 'getSymbolDecoder'],
    });
});

test('it can override the import of a linked type', async () => {
    // Given the following node.
    const node = programNode({
        definedTypes: [
            definedTypeNode({
                name: 'symbol',
                type: fixedSizeTypeNode(stringTypeNode('utf8'), 5),
            }),
            definedTypeNode({
                name: 'metadata',
                type: structTypeNode([
                    structFieldTypeNode({ name: 'identifier', type: definedTypeLinkNode('symbol') }),
                ]),
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it using a custom import.
    const renderMap = visit(
        node,
        getRenderMapVisitor({
            linkOverrides: {
                definedTypes: { symbol: 'hooked' },
            },
        }),
    );

    // Then we expect the following types and codecs to be exported.
    await renderMapContains(renderMap, 'types/metadata.ts', [
        'export type Metadata = { identifier: Symbol }',
        'export type MetadataArgs = { identifier: SymbolArgs }',
        'getSymbolEncoder()',
        'getSymbolDecoder()',
    ]);

    // And we expect the imports to be overridden.
    await renderMapContainsImports(renderMap, 'types/metadata.ts', {
        '../../hooked': ['Symbol', 'SymbolArgs', 'getSymbolEncoder', 'getSymbolDecoder'],
    });
});

test('it knows if an enum value is a scalar enum using link nodes', async () => {
    // Given a program with a scalar enum linked in a default value.
    const node = programNode({
        definedTypes: [
            definedTypeNode({
                name: 'person',
                type: structTypeNode([
                    structFieldTypeNode({
                        defaultValue: enumValueNode('direction', 'up'),
                        name: 'movement',
                        type: definedTypeLinkNode('direction'),
                    }),
                ]),
            }),
            definedTypeNode({
                name: 'direction',
                type: enumTypeNode([
                    enumEmptyVariantTypeNode('up'),
                    enumEmptyVariantTypeNode('right'),
                    enumEmptyVariantTypeNode('down'),
                    enumEmptyVariantTypeNode('left'),
                ]),
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the direction enum to be exported as a scalar enum.
    await renderMapContains(renderMap, 'types/person.ts', [
        'movement: value.movement ?? Direction.Up',
        'export type Person = { movement: Direction }',
        'export type PersonArgs = { movement?: DirectionArgs }',
        'getDirectionEncoder()',
        'getDirectionDecoder()',
    ]);

    // And we expect the following imports.
    await renderMapContainsImports(renderMap, 'types/person.ts', {
        '.': ['Direction', 'DirectionArgs', 'getDirectionEncoder', 'getDirectionDecoder'],
    });
});

test('it knows if an enum value is a data enum using link nodes', async () => {
    // Given a program with a data enum linked in a default value.
    const node = programNode({
        definedTypes: [
            definedTypeNode({
                name: 'person',
                type: structTypeNode([
                    structFieldTypeNode({
                        defaultValue: enumValueNode('action', 'stop'),
                        name: 'nextAction',
                        type: definedTypeLinkNode('action'),
                    }),
                ]),
            }),
            definedTypeNode({
                name: 'action',
                type: enumTypeNode([
                    enumEmptyVariantTypeNode('stop'),
                    enumEmptyVariantTypeNode('turnRight'),
                    enumEmptyVariantTypeNode('turnLeft'),
                    enumTupleVariantTypeNode('moveForward', tupleTypeNode([numberTypeNode('u8')])),
                ]),
            }),
        ],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we render it.
    const renderMap = visit(node, getRenderMapVisitor());

    // Then we expect the action enum to be exported as a data enum.
    await renderMapContains(renderMap, 'types/person.ts', [
        "nextAction: value.nextAction ?? action('Stop')",
        'export type Person = { nextAction: Action }',
        'export type PersonArgs = { nextAction?: ActionArgs }',
        'getActionEncoder()',
        'getActionDecoder()',
    ]);

    // And we expect the following imports.
    await renderMapContainsImports(renderMap, 'types/person.ts', {
        '.': ['Action', 'ActionArgs', 'getActionEncoder', 'getActionDecoder'],
    });
});
