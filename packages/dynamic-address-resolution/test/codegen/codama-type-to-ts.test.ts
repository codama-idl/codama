import {
    arrayTypeNode,
    booleanTypeNode,
    bytesTypeNode,
    dateTimeTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    durationTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    fixedPointTypeNode,
    fixedSizeTransformNode,
    floatTypeNode,
    integerTypeNode,
    integerValueNode,
    optionTypeNode,
    prefixedCountNode,
    publicKeyTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { codamaTypeToTS } from '../../src/codegen/codama-type-to-ts';

describe('codamaTypeToTS', () => {
    test('it maps numbers', () => {
        expect(codamaTypeToTS(integerTypeNode('u8'), [])).toBe('number | bigint');
        expect(codamaTypeToTS(integerTypeNode('i128'), [])).toBe('number | bigint');
        expect(codamaTypeToTS(fixedPointTypeNode(integerTypeNode('u64'), 6), [])).toBe('number | bigint');
        expect(codamaTypeToTS(dateTimeTypeNode(integerTypeNode('i64')), [])).toBe('number | bigint');
        expect(codamaTypeToTS(durationTypeNode(integerTypeNode('u32')), [])).toBe('number | bigint');
        expect(codamaTypeToTS(floatTypeNode('f64'), [])).toBe('number');
    });

    test('it maps scalars', () => {
        expect(codamaTypeToTS(publicKeyTypeNode(), [])).toBe('Address');
        expect(codamaTypeToTS(stringTypeNode('utf8'), [])).toBe('string');
        expect(codamaTypeToTS(booleanTypeNode(), [])).toBe('boolean');
        expect(codamaTypeToTS(bytesTypeNode(), [])).toBe('Uint8Array');
    });

    test('it ignores transforms', () => {
        const type = stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(32)] });
        expect(codamaTypeToTS(type, [])).toBe('string');
    });

    test('it appends null to options', () => {
        expect(codamaTypeToTS(optionTypeNode(publicKeyTypeNode()), [])).toBe('Address | null');
    });

    test('it parenthesises union items in arrays', () => {
        const type = arrayTypeNode(optionTypeNode(publicKeyTypeNode()), prefixedCountNode(integerTypeNode('u32')));
        expect(codamaTypeToTS(type, [])).toBe('(Address | null)[]');
    });

    test('it maps structs, marking fields with default values as optional and skipping omitted ones', () => {
        const type = structTypeNode([
            structFieldTypeNode({
                defaultValue: integerValueNode('1'),
                defaultValueStrategy: 'omitted',
                identifier: 'discriminator',
                type: integerTypeNode('u8'),
            }),
            structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() }),
            structFieldTypeNode({
                defaultValue: integerValueNode('5'),
                identifier: 'fee',
                type: integerTypeNode('u16'),
            }),
            structFieldTypeNode({ identifier: 'memo', type: optionTypeNode(stringTypeNode('utf8')) }),
        ]);
        expect(codamaTypeToTS(type, [])).toBe('{ owner: Address; fee?: number | bigint; memo?: string | null }');
    });

    test('it maps tuples', () => {
        expect(codamaTypeToTS(tupleTypeNode([publicKeyTypeNode(), booleanTypeNode()]), [])).toBe('[Address, boolean]');
    });

    test('it maps enums without data to their identifiers', () => {
        const type = enumTypeNode([enumVariantTypeNode('frozen'), enumVariantTypeNode('initialized')]);
        expect(codamaTypeToTS(type, [])).toBe("'frozen' | 'initialized'");
    });

    test('it maps enums with data to discriminated unions', () => {
        const type = enumTypeNode([
            enumVariantTypeNode('quit'),
            enumVariantTypeNode('move', {
                data: structTypeNode([structFieldTypeNode({ identifier: 'x', type: integerTypeNode('u8') })]),
            }),
        ]);
        expect(codamaTypeToTS(type, [])).toBe("{ __kind: 'quit' } | { __kind: 'move'; data: { x: number | bigint } }");
    });

    test('it resolves defined type links', () => {
        const definedTypes = [definedTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })];
        expect(codamaTypeToTS(definedTypeLinkNode('amount'), definedTypes)).toBe('number | bigint');
        expect(codamaTypeToTS(definedTypeLinkNode('missing'), [])).toBe(
            'unknown /** DefinedTypeNode not found for definedTypeLinkNode */',
        );
    });
});
