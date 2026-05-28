import { camelCase, type DefinedTypeNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { codamaTypeToTS } from '../../src/codegen/codama-type-to-ts';

const NO_DEFINED: DefinedTypeNode[] = [];

describe('codamaTypeToTS', () => {
    test('should map numeric format to number or bigint', () => {
        expect(codamaTypeToTS({ endian: 'le', format: 'u32', kind: 'numberTypeNode' }, NO_DEFINED)).toBe('number');
        expect(codamaTypeToTS({ endian: 'le', format: 'u64', kind: 'numberTypeNode' }, NO_DEFINED)).toBe(
            'number | bigint',
        );
        expect(codamaTypeToTS({ endian: 'le', format: 'i128', kind: 'numberTypeNode' }, NO_DEFINED)).toBe(
            'number | bigint',
        );
    });

    test('should map primitive types to TS scalars', () => {
        expect(codamaTypeToTS({ kind: 'publicKeyTypeNode' }, NO_DEFINED)).toBe('Address');
        expect(codamaTypeToTS({ encoding: 'utf8', kind: 'stringTypeNode' }, NO_DEFINED)).toBe('string');
        expect(
            codamaTypeToTS(
                { kind: 'booleanTypeNode', size: { endian: 'le', format: 'u8', kind: 'numberTypeNode' } },
                NO_DEFINED,
            ),
        ).toBe('boolean');
        expect(codamaTypeToTS({ kind: 'bytesTypeNode' }, NO_DEFINED)).toBe('Uint8Array');
    });

    test('should append | null for option types', () => {
        expect(
            codamaTypeToTS(
                {
                    item: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                    kind: 'optionTypeNode',
                    prefix: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                },
                NO_DEFINED,
            ),
        ).toBe('number | null');
    });

    test('should parenthesize union item types in arrays', () => {
        expect(
            codamaTypeToTS(
                {
                    count: { kind: 'fixedCountNode', value: 4 },
                    item: {
                        item: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                        kind: 'optionTypeNode',
                        prefix: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                    },
                    kind: 'arrayTypeNode',
                },
                NO_DEFINED,
            ),
        ).toBe('(number | null)[]');
    });

    test('should emit field unions for struct types', () => {
        const result = codamaTypeToTS(
            {
                fields: [
                    {
                        kind: 'structFieldTypeNode',
                        name: camelCase('a'),
                        type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                    },
                    {
                        kind: 'structFieldTypeNode',
                        name: camelCase('b'),
                        type: { encoding: 'utf8', kind: 'stringTypeNode' },
                    },
                ],
                kind: 'structTypeNode',
            },
            NO_DEFINED,
        );
        expect(result).toBe('{ a: number; b: string }');
    });

    test('should emit a string union for all-empty enums', () => {
        expect(
            codamaTypeToTS(
                {
                    kind: 'enumTypeNode',
                    size: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                    variants: [
                        { kind: 'enumEmptyVariantTypeNode', name: camelCase('one') },
                        { kind: 'enumEmptyVariantTypeNode', name: camelCase('two') },
                    ],
                },
                NO_DEFINED,
            ),
        ).toBe("'one' | 'two'");
    });

    test('should resolve definedTypeLinkNode through definedTypes', () => {
        const definedTypes: DefinedTypeNode[] = [
            {
                docs: [],
                kind: 'definedTypeNode',
                name: camelCase('amount'),
                type: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
            },
        ];
        expect(codamaTypeToTS({ kind: 'definedTypeLinkNode', name: camelCase('amount') }, definedTypes)).toBe(
            'number | bigint',
        );
    });

    test('should fall back to unknown for unknown definedTypeLinkNode', () => {
        expect(codamaTypeToTS({ kind: 'definedTypeLinkNode', name: camelCase('missing') }, NO_DEFINED)).toBe(
            'unknown /** DefinedTypeNode not found for definedTypeLinkNode */',
        );
    });
});
