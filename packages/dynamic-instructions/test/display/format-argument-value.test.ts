import {
    amountNumberDisplayNode,
    arrayTypeNode,
    dateTimeNumberDisplayNode,
    definedTypeLinkNode,
    type DefinedTypeNode,
    definedTypeNode,
    durationNumberDisplayNode,
    enumEmptyVariantTypeNode,
    enumTupleVariantTypeNode,
    enumTypeNode,
    enumVariantDisplayNode,
    injectedValueNode,
    numberTypeNode,
    numberValueNode,
    optionTypeNode,
    remainderCountNode,
    stringDisplayNode,
    stringTypeNode,
    stringValueNode,
    tupleTypeNode,
    type TypeNode,
    zeroableOptionTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { formatArgumentValue } from '../../src/display/format-argument-value';
import { displayContext, mockResolveDefinedType } from '../test-utils';

describe('formatArgumentValue', () => {
    test('it formats a number with an amount display node', async () => {
        // Given a u64 typed with an amount display.
        const type = numberTypeNode('u64', 'le', {
            display: amountNumberDisplayNode({ decimals: numberValueNode(9) }),
        });

        // When we format a raw amount.
        const result = await formatArgumentValue(type, [], 1_500_000_000n, displayContext());

        // Then we expect the scaled value.
        expect(result.text).toBe('1.5');
    });

    test('it formats a number with a date-time display node', async () => {
        // Given a u32 typed as a date-time.
        const type = numberTypeNode('u32', 'le', { display: dateTimeNumberDisplayNode({}) });

        // When we format a seconds timestamp.
        const result = await formatArgumentValue(type, [], 1_761_365_183, displayContext());

        // Then we expect the ISO 8601 form.
        expect(result.text).toBe('2025-10-25T04:06:23.000Z');
    });

    test('it formats a number with a duration display node', async () => {
        // Given a u64 typed as a duration.
        const type = numberTypeNode('u64', 'le', { display: durationNumberDisplayNode({}) });

        // When we format a duration in seconds.
        const result = await formatArgumentValue(type, [], 3600n, displayContext());

        // Then we expect the HH:mm:ss form.
        expect(result.text).toBe('01:00:00');
    });

    test('it slices a string with a string display node', async () => {
        // Given a string typed with a slice display.
        const type = stringTypeNode('utf8', { display: stringDisplayNode({ sliceEnd: 3, sliceStart: 0 }) });

        // When we format a string value.
        const result = await formatArgumentValue(type, [], 'SOLANA', displayContext());

        // Then we expect the sliced substring.
        expect(result.text).toBe('SOL');
    });

    test('it falls back to raw and flags degradation when amount decimals cannot be resolved', async () => {
        // Given an amount whose injected decimals have no provider.
        const type = numberTypeNode('u64', 'le', {
            display: amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) }),
        });

        // When we format the amount.
        const result = await formatArgumentValue(type, [], 1_000_000n, displayContext());

        // Then we expect the raw value explicitly marked and flagged as degraded: unmarked, it
        // would read exactly like a scaled amount.
        expect(result).toEqual({ degraded: true, text: '1000000 (raw)' });
    });

    test('it does not flag an amount with absent decimals as degraded', async () => {
        // Given an amount display with a unit but no decimals attribute (a valid "no scaling" authoring).
        const type = numberTypeNode('u64', 'le', {
            display: amountNumberDisplayNode({ unit: stringValueNode('base units') }),
        });

        // When we format the amount.
        const result = await formatArgumentValue(type, [], 1_500_000n, displayContext());

        // Then we expect the unscaled value with its unit, not a degradation.
        expect(result).toEqual({ degraded: false, text: '1500000 base units' });
    });

    test('it does not flag an unpresentable date-time as degraded', async () => {
        // Given a date-time display and a tick value that cannot form a valid date.
        const type = numberTypeNode('u64', 'le', { display: dateTimeNumberDisplayNode({}) });

        // When we format an absurd timestamp.
        const result = await formatArgumentValue(type, [], 999_999_999_999_999n, displayContext());

        // Then we expect the raw fallback without degradation: a raw timestamp carries no false scale.
        expect(result).toEqual({ degraded: false, text: '999999999999999' });
    });

    test('it renders a raw number when the type has no display node', async () => {
        // Given a plain number type with no display.
        const type = numberTypeNode('u64');

        // When we format the value.
        const result = await formatArgumentValue(type, [], 42n, displayContext());

        // Then we expect the raw string.
        expect(result.text).toBe('42');
    });

    test('it renders an empty string for an undefined value rather than the string "undefined"', async () => {
        // Given a plain number type and a missing (undefined) decoded value.
        const type = numberTypeNode('u64');

        // When we format the value.
        const result = await formatArgumentValue(type, [], undefined, displayContext());

        // Then we expect an empty string, not `JSON.stringify(undefined)`.
        expect(result.text).toBe('');
    });

    test('it labels a scalar enum variant using its display label', async () => {
        // Given a scalar enum whose variant carries a display label.
        const type = enumTypeNode([
            enumEmptyVariantTypeNode('buy', undefined, { display: enumVariantDisplayNode({ label: 'Buy' }) }),
            enumEmptyVariantTypeNode('sell', undefined, { display: enumVariantDisplayNode({ label: 'Sell' }) }),
        ]);

        // When we format the decoded variant name.
        const result = await formatArgumentValue(type, [], 'buy', displayContext());

        // Then we expect the variant label.
        expect(result.text).toBe('Buy');
    });

    test('it title-cases a scalar enum variant without a display label', async () => {
        // Given a scalar enum variant with no display.
        const type = enumTypeNode([enumEmptyVariantTypeNode('buyNow'), enumEmptyVariantTypeNode('sell')]);

        // When we format the decoded variant name.
        const result = await formatArgumentValue(type, [], 'buyNow', displayContext());

        // Then we expect the title-cased variant name.
        expect(result.text).toBe('Buy Now');
    });

    test('it resolves a defined-type link to a linked enum', async () => {
        // Given an argument typed as a link to a defined enum.
        const orderType: DefinedTypeNode = definedTypeNode({
            name: 'orderType',
            type: enumTypeNode([
                enumEmptyVariantTypeNode('buy', undefined, { display: enumVariantDisplayNode({ label: 'Buy' }) }),
                enumEmptyVariantTypeNode('sell', undefined, { display: enumVariantDisplayNode({ label: 'Sell' }) }),
            ]),
        });
        const type: TypeNode = definedTypeLinkNode('orderType');

        // When we format the decoded variant name.
        const result = await formatArgumentValue(
            type,
            [],
            'sell',
            displayContext({ resolveDefinedType: mockResolveDefinedType(orderType) }),
        );

        // Then we expect the linked variant label.
        expect(result.text).toBe('Sell');
    });

    test('it unwraps a present option value through the item display', async () => {
        // Given an option of a u64 typed with an amount display.
        const type = optionTypeNode(
            numberTypeNode('u64', 'le', {
                display: amountNumberDisplayNode({ decimals: numberValueNode(9), unit: stringValueNode('SOL') }),
            }),
        );

        // When we format a `Some` value.
        const result = await formatArgumentValue(
            type,
            [],
            { __option: 'Some', value: 1_500_000_000n },
            displayContext(),
        );

        // Then we expect the inner value rendered through the item's display.
        expect(result.text).toBe('1.5 SOL');
    });

    test('it renders an absent option value as none', async () => {
        // Given an option of a displayed number type.
        const type = optionTypeNode(
            numberTypeNode('u64', 'le', { display: amountNumberDisplayNode({ decimals: numberValueNode(9) }) }),
        );

        // When we format a `None` value.
        const result = await formatArgumentValue(type, [], { __option: 'None' }, displayContext());

        // Then we expect the human-readable absence marker.
        expect(result.text).toBe('none');
    });

    test('it unwraps a zeroable option value through the item display', async () => {
        // Given a zeroable option of a displayed number type.
        const type = zeroableOptionTypeNode(
            numberTypeNode('u64', 'le', { display: amountNumberDisplayNode({ decimals: numberValueNode(6) }) }),
        );

        // When we format a `Some` value.
        const result = await formatArgumentValue(type, [], { __option: 'Some', value: 1_500_000n }, displayContext());

        // Then we expect the inner value rendered through the item's display.
        expect(result.text).toBe('1.5');
    });

    test('it unwraps an option of a linked enum to the variant label', async () => {
        // Given an option of a link to a defined enum.
        const orderType: DefinedTypeNode = definedTypeNode({
            name: 'orderType',
            type: enumTypeNode([
                enumEmptyVariantTypeNode('buy', undefined, { display: enumVariantDisplayNode({ label: 'Buy' }) }),
                enumEmptyVariantTypeNode('sell'),
            ]),
        });
        const type = optionTypeNode(definedTypeLinkNode('orderType'));

        // When we format a `Some` variant name.
        const result = await formatArgumentValue(
            type,
            [],
            { __option: 'Some', value: 'buy' },
            displayContext({ resolveDefinedType: mockResolveDefinedType(orderType) }),
        );

        // Then we expect the linked variant label.
        expect(result.text).toBe('Buy');
    });

    test('it labels a scalar enum variant decoded as a numeric index', async () => {
        // Given a scalar enum with positional discriminators.
        const type = enumTypeNode([
            enumEmptyVariantTypeNode('buy', undefined, { display: enumVariantDisplayNode({ label: 'Buy' }) }),
            enumEmptyVariantTypeNode('sell', undefined, { display: enumVariantDisplayNode({ label: 'Sell' }) }),
        ]);

        // When we format the numeric index the dynamic codecs decode to.
        const result = await formatArgumentValue(type, [], 1, displayContext());

        // Then we expect the matching variant's label, not the bare index.
        expect(result.text).toBe('Sell');
    });

    test('it labels a scalar enum variant decoded as an explicit discriminator value', async () => {
        // Given a scalar enum whose variants declare explicit discriminators.
        const type = enumTypeNode([enumEmptyVariantTypeNode('legacy', 5), enumEmptyVariantTypeNode('current', 7)]);

        // When we format an explicit discriminator value.
        const result = await formatArgumentValue(type, [], 7, displayContext());

        // Then we expect the variant matching that discriminator, not the position.
        expect(result.text).toBe('Current');
    });

    test('it falls back to the raw index when no variant matches', async () => {
        // Given a scalar enum with two variants.
        const type = enumTypeNode([enumEmptyVariantTypeNode('buy'), enumEmptyVariantTypeNode('sell')]);

        // When we format an out-of-range index.
        const result = await formatArgumentValue(type, [], 9, displayContext());

        // Then we expect the raw value.
        expect(result.text).toBe('9');
    });

    test('it matches a data enum kind regardless of casing', async () => {
        // Given an enum whose decoded `__kind` arrives in raw camelCase (codecs disagree on casing).
        const type = enumTypeNode([
            enumEmptyVariantTypeNode('name'),
            enumEmptyVariantTypeNode('symbol'),
            enumTupleVariantTypeNode('key', tupleTypeNode([stringTypeNode('utf8')])),
        ]);

        // When we format both casings of a variant kind.
        const rawCased = await formatArgumentValue(type, [], { __kind: 'symbol' }, displayContext());
        const pascalCased = await formatArgumentValue(type, [], { __kind: 'Symbol' }, displayContext());

        // Then we expect both to match the variant.
        expect(rawCased.text).toBe('Symbol');
        expect(pascalCased.text).toBe('Symbol');
    });

    test('it renders arrays compactly through their item display', async () => {
        // Given an array of amounts scaled to 9 decimals.
        const type = arrayTypeNode(
            numberTypeNode('u64', 'le', {
                display: amountNumberDisplayNode({ decimals: numberValueNode(9), unit: stringValueNode('SOL') }),
            }),
            remainderCountNode(),
        );

        // When we format an array value.
        const result = await formatArgumentValue(type, [], [1_500_000_000n, 500_000_000n], displayContext());

        // Then we expect a comma-joined line with each element presented.
        expect(result).toEqual({ degraded: false, text: '1.5 SOL, 0.5 SOL' });
    });

    test('it marks degraded array elements inline and flags the array', async () => {
        // Given an array of amounts whose injected decimals have no provider.
        const type = arrayTypeNode(
            numberTypeNode('u64', 'le', {
                display: amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) }),
            }),
            remainderCountNode(),
        );

        // When we format an array value.
        const result = await formatArgumentValue(type, [], [1_000_000n, 500_000n], displayContext());

        // Then we expect each element marked raw and the whole array flagged as degraded.
        expect(result).toEqual({ degraded: true, text: '1000000 (raw), 500000 (raw)' });
    });

    test('it unwraps nested option values', async () => {
        // Given an option of an option of a plain number.
        const type = optionTypeNode(optionTypeNode(numberTypeNode('u64')));

        // When we format a doubly-wrapped value.
        const result = await formatArgumentValue(
            type,
            [],
            { __option: 'Some', value: { __option: 'Some', value: 42n } },
            displayContext(),
        );

        // Then we expect the innermost value.
        expect(result.text).toBe('42');
    });
});
