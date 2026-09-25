import { CODAMA_ERROR__VISITORS__INVALID_NUMBER_WRAPPER, CodamaError, isCodamaError } from '@codama/errors';
import {
    amountNumberDisplayNode,
    assertIsNode,
    constantValueNode,
    dateTimeTypeNode,
    durationTypeNode,
    enumTypeNode,
    fixedPointTypeNode,
    fixedSizeTransformNode,
    floatTypeNode,
    hiddenPrefixTransformNode,
    hiddenSuffixTransformNode,
    injectedValueNode,
    integerTypeNode,
    integerValueNode,
    optionTypeNode,
    sizePrefixTransformNode,
    stringTypeNode,
    stringValueNode,
    structFieldTypeNode,
    structFieldValueNode,
    structTypeNode,
    structValueNode,
    TypeNode,
    unitNumberDisplayNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { NumberWrapper, setNumberWrappersVisitor } from '../src';

const struct = (fields: Record<string, TypeNode>) =>
    structTypeNode(Object.entries(fields).map(([identifier, type]) => structFieldTypeNode({ identifier, type })));
const wrapField = (type: TypeNode, wrapper: NumberWrapper) => {
    const result = visit(struct({ value: type }), setNumberWrappersVisitor({ value: wrapper }));
    assertIsNode(result, 'structTypeNode');
    return result.fields?.[0].type;
};

test('it wraps integers in fixed points, date-times and durations', () => {
    const u64 = integerTypeNode('u64');
    const i64 = integerTypeNode('i64');
    expect(wrapField(u64, { kind: 'FixedPoint', scale: 6, unit: 'USDC' })).toStrictEqual(
        fixedPointTypeNode(u64, 6, { unit: 'USDC' }),
    );
    expect(wrapField(u64, { base: 2, kind: 'FixedPoint', scale: 32 })).toStrictEqual(
        fixedPointTypeNode(u64, 32, { base: 2 }),
    );
    expect(wrapField(u64, { kind: 'SolAmount' })).toStrictEqual(fixedPointTypeNode(u64, 9, { unit: 'SOL' }));
    expect(wrapField(i64, { kind: 'DateTime' })).toStrictEqual(dateTimeTypeNode(i64));
    expect(wrapField(i64, { kind: 'Duration', ticksPerSecond: 1000 })).toStrictEqual(
        durationTypeNode(i64, { ticksPerSecond: 1000 }),
    );
});

test('it sets units and displays on integers', () => {
    const decimals = injectedValueNode({ key: 'decimals' });
    expect(wrapField(integerTypeNode('u32'), { kind: 'Unit', unit: 'bytes' })).toStrictEqual(
        integerTypeNode('u32', { unit: 'bytes' }),
    );
    expect(wrapField(integerTypeNode('u64'), { decimals, kind: 'AmountDisplay' })).toStrictEqual(
        integerTypeNode('u64', { display: amountNumberDisplayNode({ decimals }) }),
    );
    expect(wrapField(integerTypeNode('u16'), { kind: 'UnitDisplay', unit: stringValueNode('bps') })).toStrictEqual(
        integerTypeNode('u16', { display: unitNumberDisplayNode({ unit: stringValueNode('bps') }) }),
    );
});

test('it sets units and unit displays on floats only', () => {
    const f64 = floatTypeNode('f64');
    expect(wrapField(f64, { kind: 'Unit', unit: 'USD' })).toStrictEqual(floatTypeNode('f64', { unit: 'USD' }));
    expect(wrapField(f64, { kind: 'UnitDisplay', unit: stringValueNode('USD') })).toStrictEqual(
        floatTypeNode('f64', { display: unitNumberDisplayNode({ unit: stringValueNode('USD') }) }),
    );
    expect(wrapField(f64, { kind: 'SolAmount' })).toStrictEqual(f64);
});

test('it moves the transforms of the integer onto the wrapper', () => {
    const transforms = [fixedSizeTransformNode(16)];
    expect(wrapField(integerTypeNode('u64', { transforms }), { kind: 'SolAmount' })).toStrictEqual(
        fixedPointTypeNode(integerTypeNode('u64'), 9, { transforms, unit: 'SOL' }),
    );
});

test('it does not wrap integers used as sizes or prefixes', () => {
    // Given a field whose integers are an option prefix, a size prefix and an enum size.
    const label = stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] });
    const kind = enumTypeNode([], { size: integerTypeNode('u16') });
    const node = struct({
        kind,
        label,
        value: optionTypeNode(integerTypeNode('u64'), { prefix: integerTypeNode('u8') }),
    });

    // When we wrap every number of the struct.
    const result = visit(node, setNumberWrappersVisitor({ '[structTypeNode]': { kind: 'Unit', unit: 'x' } }));

    // Then only the value of the option is wrapped.
    expect(result).toStrictEqual(
        struct({
            kind,
            label,
            value: optionTypeNode(integerTypeNode('u64', { unit: 'x' }), { prefix: integerTypeNode('u8') }),
        }),
    );
});

test('it does not wrap numbers that are already wrapped', () => {
    // Given a field that is already a fixed point.
    const node = struct({ value: fixedPointTypeNode(integerTypeNode('u64'), 6) });

    // When we wrap it again, then nothing changes.
    expect(visit(node, setNumberWrappersVisitor({ value: { kind: 'DateTime' } }))).toStrictEqual(node);
});

test('it throws on invalid wrappers', () => {
    const expectInvalid = (fn: () => unknown) => {
        let error: unknown;
        try {
            fn();
        } catch (e) {
            error = e;
        }
        expect(isCodamaError(error, CODAMA_ERROR__VISITORS__INVALID_NUMBER_WRAPPER)).toBe(true);
    };

    // An unknown kind or a zero scale throws when creating the visitor.
    expectInvalid(() => setNumberWrappersVisitor({ value: { kind: 'Amount' } as never }));
    expectInvalid(() => setNumberWrappersVisitor({ value: { kind: 'FixedPoint', scale: 0 } }));

    // A shortU16 fixed point or a wrapped integer with a unit throws when visiting.
    expectInvalid(() => wrapField(integerTypeNode('shortU16'), { kind: 'SolAmount' }));
    expectInvalid(() => wrapField(integerTypeNode('i64', { unit: 's' }), { kind: 'DateTime' }));
});

test('it reports the wrapper kind and reason', () => {
    expect(() => setNumberWrappersVisitor({ value: { kind: 'FixedPoint', scale: 0 } })).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__INVALID_NUMBER_WRAPPER, {
            kind: 'FixedPoint',
            reason: 'a fixed point must have a non-zero scale; use a `Unit` wrapper instead',
            wrapper: { kind: 'FixedPoint', scale: 0 },
        }),
    );
});

test('it does not wrap numbers within the types of constants', () => {
    // Given a field with a hidden prefix constant and a constant whose type is a struct.
    const prefix = constantValueNode(integerTypeNode('u64'), integerValueNode('1'));
    const structConstant = constantValueNode(
        struct({ inner: integerTypeNode('u64') }),
        structValueNode([structFieldValueNode('inner', integerValueNode('2'))]),
    );
    const node = struct({
        value: integerTypeNode('i64', {
            transforms: [hiddenPrefixTransformNode([prefix]), hiddenSuffixTransformNode([structConstant])],
        }),
    });

    // When we wrap every number of the struct.
    const result = visit(node, setNumberWrappersVisitor({ '[structTypeNode]': { kind: 'DateTime' } }));

    // Then only the field itself is wrapped and the constants are untouched.
    expect(result).toStrictEqual(
        struct({
            value: dateTimeTypeNode(integerTypeNode('i64'), {
                transforms: [hiddenPrefixTransformNode([prefix]), hiddenSuffixTransformNode([structConstant])],
            }),
        }),
    );
});
