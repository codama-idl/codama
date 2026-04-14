import {
    arrayTypeNode,
    bytesTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTupleVariantTypeNode,
    enumTypeNode,
    numberTypeNode,
    optionTypeNode,
    prefixedCountNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('enumTypeNode', () => {
    // Based on pmp-idl.json, mpl-token-metadata-idl.json, token-2022-idl.json

    test('should pass through scalar enum (number)', () => {
        // Based on pmp-idl.json: accountDiscriminator enum
        const scalarEnum = enumTypeNode([
            enumEmptyVariantTypeNode('empty'),
            enumEmptyVariantTypeNode('buffer'),
            enumEmptyVariantTypeNode('metadata'),
        ]);
        const transformer = createInputValueTransformer(scalarEnum, rootNodeMock);

        expect(transformer(0)).toBe(0);
        expect(transformer(1)).toBe(1);
        expect(transformer(2)).toBe(2);
    });

    test('should pass through scalar enum (string)', () => {
        const scalarEnum = enumTypeNode([enumEmptyVariantTypeNode('initialized'), enumEmptyVariantTypeNode('frozen')]);
        const transformer = createInputValueTransformer(scalarEnum, rootNodeMock);

        expect(transformer('initialized')).toBe('initialized');
        expect(transformer('frozen')).toBe('frozen');
    });

    test('should pass through empty variant enum', () => {
        const dataEnum = enumTypeNode([
            enumEmptyVariantTypeNode('none'),
            enumEmptyVariantTypeNode('utf8'),
            enumEmptyVariantTypeNode('base58'),
        ]);
        const transformer = createInputValueTransformer(dataEnum, rootNodeMock);

        const input = { __kind: 'none' };
        expect(transformer(input)).toEqual({ __kind: 'None' });
    });

    test('should transform bytes in struct variant', () => {
        // Based on mpl-token-metadata-idl.json: complex enum with struct variants
        const enumWithStructVariant = enumTypeNode([
            enumEmptyVariantTypeNode('empty'),
            enumStructVariantTypeNode(
                'withData',
                structTypeNode([
                    structFieldTypeNode({ name: 'id', type: numberTypeNode('u32') }),
                    structFieldTypeNode({ name: 'data', type: bytesTypeNode() }),
                ]),
            ),
        ]);

        const transformer = createInputValueTransformer(enumWithStructVariant, rootNodeMock, {
            bytesEncoding: 'base16',
        });

        const input = {
            __kind: 'withData',
            data: new Uint8Array([1, 2, 3]),
            id: 42,
        };

        expect(transformer(input)).toEqual({
            __kind: 'WithData',
            data: ['base16', '010203'],
            id: 42,
        });
    });

    test('should transform bytes in tuple variant', () => {
        const enumWithTupleVariant = enumTypeNode([
            enumEmptyVariantTypeNode('empty'),
            enumTupleVariantTypeNode('withBytes', tupleTypeNode([bytesTypeNode(), numberTypeNode('u8')])),
        ]);

        const transformer = createInputValueTransformer(enumWithTupleVariant, rootNodeMock, {
            bytesEncoding: 'base16',
        });

        const input = {
            __kind: 'withBytes',
            fields: [new Uint8Array([0xde, 0xad]), 255],
        };

        expect(transformer(input)).toEqual({
            __kind: 'WithBytes',
            fields: [['base16', 'dead'], 255],
        });
    });

    test('should throw on unknown variant', () => {
        const enumWithVariants = enumTypeNode([enumEmptyVariantTypeNode('known1'), enumEmptyVariantTypeNode('known2')]);

        const transformer = createInputValueTransformer(enumWithVariants, rootNodeMock);

        const input = { __kind: 'unknownVariant', someData: 123 };
        expect(() => transformer(input)).toThrow(/Expected \[one of \[known1, known2\]\] for \[enumTypeNode\]/);
    });

    test('should pass through non-object input for enumTypeNode', () => {
        const enumNode = enumTypeNode([enumEmptyVariantTypeNode('variant1'), enumEmptyVariantTypeNode('variant2')]);

        const transformer = createInputValueTransformer(enumNode, rootNodeMock);

        expect(transformer(null)).toBe(null);
        expect(transformer(undefined)).toBe(undefined);
        expect(transformer('string')).toBe('string');
    });

    test('should handle enum without __kind discriminator', () => {
        const enumNode = enumTypeNode([enumEmptyVariantTypeNode('variant1')]);
        const transformer = createInputValueTransformer(enumNode, rootNodeMock);

        // Object without __kind should pass through
        const input = { someField: 'value' };
        expect(transformer(input)).toEqual(input);
    });

    test('should handle nested enum with multiple bytes fields in struct variant', () => {
        // Complex real-world scenario
        const complexEnum = enumTypeNode([
            enumEmptyVariantTypeNode('none'),
            enumStructVariantTypeNode(
                'complex',
                structTypeNode([
                    structFieldTypeNode({ name: 'id', type: numberTypeNode('u32') }),
                    structFieldTypeNode({ name: 'key', type: bytesTypeNode() }),
                    structFieldTypeNode({ name: 'value', type: bytesTypeNode() }),
                    structFieldTypeNode({
                        name: 'nested',
                        type: optionTypeNode(bytesTypeNode()),
                    }),
                ]),
            ),
        ]);

        const transformer = createInputValueTransformer(complexEnum, rootNodeMock, { bytesEncoding: 'base16' });

        const input = {
            __kind: 'complex',
            id: 100,
            key: new Uint8Array([1, 2]),
            nested: new Uint8Array([5, 6]),
            value: new Uint8Array([3, 4]),
        };

        expect(transformer(input)).toEqual({
            __kind: 'Complex',
            id: 100,
            key: ['base16', '0102'],
            nested: ['base16', '0506'],
            value: ['base16', '0304'],
        });
    });

    test('should handle enum with array of bytes in struct variant', () => {
        const enumWithArray = enumTypeNode([
            enumStructVariantTypeNode(
                'withArray',
                structTypeNode([
                    structFieldTypeNode({
                        name: 'items',
                        type: arrayTypeNode(bytesTypeNode(), prefixedCountNode(numberTypeNode('u32'))),
                    }),
                ]),
            ),
        ]);

        const transformer = createInputValueTransformer(enumWithArray, rootNodeMock, { bytesEncoding: 'base16' });

        const input = {
            __kind: 'withArray',
            items: [new Uint8Array([1, 2]), new Uint8Array([3, 4])],
        };

        expect(transformer(input)).toEqual({
            __kind: 'WithArray',
            items: [
                ['base16', '0102'],
                ['base16', '0304'],
            ],
        });
    });

    test('should throw on tuple variant without fields', () => {
        const enumWithTuple = enumTypeNode([
            enumTupleVariantTypeNode('tuple', tupleTypeNode([numberTypeNode('u32'), bytesTypeNode()])),
        ]);

        const transformer = createInputValueTransformer(enumWithTuple, rootNodeMock, { bytesEncoding: 'base16' });

        const input = { __kind: 'tuple', someOtherProp: 123 };
        expect(() => transformer(input)).toThrow(/Expected \[array \(fields\)\] for \[enumTupleVariantTypeNode\]/);
    });

    test('should handle deeply nested enum variants', () => {
        // Enum containing another enum in struct variant
        const innerEnum = enumTypeNode([
            enumEmptyVariantTypeNode('inner1'),
            enumStructVariantTypeNode(
                'inner2',
                structTypeNode([structFieldTypeNode({ name: 'data', type: bytesTypeNode() })]),
            ),
        ]);

        const root = rootNode(
            programNode({
                definedTypes: [
                    definedTypeNode({
                        name: 'InnerEnum',
                        type: innerEnum,
                    }),
                ],
                name: 'test',
                publicKey: '11111111111111111111111111111111',
            }),
        );

        const outerEnum = enumTypeNode([
            enumStructVariantTypeNode(
                'outer',
                structTypeNode([structFieldTypeNode({ name: 'inner', type: definedTypeLinkNode('InnerEnum') })]),
            ),
        ]);

        const transformer = createInputValueTransformer(outerEnum, root, { bytesEncoding: 'base16' });

        const input = {
            __kind: 'outer',
            inner: {
                __kind: 'inner2',
                data: new Uint8Array([0xff, 0xee]),
            },
        };

        expect(transformer(input)).toEqual({
            __kind: 'Outer',
            inner: {
                __kind: 'Inner2',
                data: ['base16', 'ffee'],
            },
        });
    });
});
