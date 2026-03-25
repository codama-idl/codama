import {
    arrayTypeNode,
    bytesTypeNode,
    fixedCountNode,
    numberTypeNode,
    optionTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { createInputValueTransformer } from '../../../../src/instruction-encoding/visitors/input-value-transformer';
import { rootNodeMock } from './input-value-transformer-test-utils';

describe('structTypeNode', () => {
    test('should transform struct with bytes field', () => {
        const transformer = createInputValueTransformer(
            structTypeNode([
                structFieldTypeNode({ name: 'name', type: stringTypeNode('utf8') }),
                structFieldTypeNode({ name: 'data', type: bytesTypeNode() }),
            ]),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );

        const input = {
            data: new Uint8Array([1, 2, 3]),
            name: 'test',
        };

        expect(transformer(input)).toEqual({
            data: ['base16', '010203'],
            name: 'test',
        });
    });

    test('should transform complex nested structure with bytes in array', () => {
        const transformer = createInputValueTransformer(
            structTypeNode([
                structFieldTypeNode({ name: 'id', type: numberTypeNode('u32') }),
                structFieldTypeNode({
                    name: 'items',
                    type: arrayTypeNode(
                        structTypeNode([
                            structFieldTypeNode({ name: 'name', type: stringTypeNode('utf8') }),
                            structFieldTypeNode({ name: 'data', type: bytesTypeNode() }),
                        ]),
                        fixedCountNode(2),
                    ),
                }),
            ]),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );

        const input = {
            id: 123,
            items: [
                { data: new Uint8Array([1, 2, 3]), name: 'item1' },
                { data: new Uint8Array([4, 5]), name: 'item2' },
            ],
        };

        expect(transformer(input)).toEqual({
            id: 123,
            items: [
                { data: ['base16', '010203'], name: 'item1' },
                { data: ['base16', '0405'], name: 'item2' },
            ],
        });
    });

    test('should throw error for non-object input', () => {
        const transformer = createInputValueTransformer(
            structTypeNode([structFieldTypeNode({ name: 'data', type: bytesTypeNode() })]),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );

        expect(() => transformer(null)).toThrow('Expected a plain object for structTypeNode');
        expect(() => transformer(undefined)).toThrow('Expected a plain object for structTypeNode');
        expect(() => transformer('not an object')).toThrow('Expected a plain object for structTypeNode');
        expect(() => transformer(123)).toThrow('Expected a plain object for structTypeNode');
        expect(() => transformer([1, 2, 3])).toThrow('Expected a plain object for structTypeNode');
    });

    test('should throw error for Date, Map, and Set inputs', () => {
        const transformer = createInputValueTransformer(
            structTypeNode([structFieldTypeNode({ name: 'data', type: bytesTypeNode() })]),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );

        expect(() => transformer(new Date())).toThrow('Expected a plain object for structTypeNode');
        expect(() => transformer(new Map())).toThrow('Expected a plain object for structTypeNode');
        expect(() => transformer(new Set())).toThrow('Expected a plain object for structTypeNode');
    });

    test('should transform multiple bytes fields in struct', () => {
        const transformer = createInputValueTransformer(
            structTypeNode([
                structFieldTypeNode({ name: 'key', type: bytesTypeNode() }),
                structFieldTypeNode({ name: 'value', type: bytesTypeNode() }),
                structFieldTypeNode({ name: 'id', type: numberTypeNode('u32') }),
            ]),
            rootNodeMock,
            { bytesEncoding: 'base16' },
        );

        const input = {
            id: 999,
            key: new Uint8Array([1, 2]),
            value: new Uint8Array([3, 4, 5]),
        };

        expect(transformer(input)).toEqual({
            id: 999,
            key: ['base16', '0102'],
            value: ['base16', '030405'],
        });
    });

    test('should handle struct with missing optional fields', () => {
        const structNode = structTypeNode([
            structFieldTypeNode({ name: 'required', type: numberTypeNode('u32') }),
            structFieldTypeNode({ name: 'optional', type: optionTypeNode(bytesTypeNode()) }),
        ]);
        const transformer = createInputValueTransformer(structNode, rootNodeMock, { bytesEncoding: 'base16' });

        const input = { required: 100 };
        expect(transformer(input)).toEqual({ required: 100 });
    });
});
