import {
    amountNumberDisplayNode,
    dateTimeNumberDisplayNode,
    definedTypeLinkNode,
    type DefinedTypeNode,
    definedTypeNode,
    durationNumberDisplayNode,
    enumEmptyVariantTypeNode,
    enumTypeNode,
    enumVariantDisplayNode,
    injectedValueNode,
    numberTypeNode,
    numberValueNode,
    stringDisplayNode,
    stringTypeNode,
    type TypeNode,
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
        expect(result).toBe('1.5');
    });

    test('it formats a number with a date-time display node', async () => {
        // Given a u32 typed as a date-time.
        const type = numberTypeNode('u32', 'le', { display: dateTimeNumberDisplayNode({}) });

        // When we format a seconds timestamp.
        const result = await formatArgumentValue(type, [], 1_761_365_183, displayContext());

        // Then we expect the ISO 8601 form.
        expect(result).toBe('2025-10-25T04:06:23.000Z');
    });

    test('it formats a number with a duration display node', async () => {
        // Given a u64 typed as a duration.
        const type = numberTypeNode('u64', 'le', { display: durationNumberDisplayNode({}) });

        // When we format a duration in seconds.
        const result = await formatArgumentValue(type, [], 3600n, displayContext());

        // Then we expect the HH:mm:ss form.
        expect(result).toBe('01:00:00');
    });

    test('it slices a string with a string display node', async () => {
        // Given a string typed with a slice display.
        const type = stringTypeNode('utf8', { display: stringDisplayNode({ sliceEnd: 3, sliceStart: 0 }) });

        // When we format a string value.
        const result = await formatArgumentValue(type, [], 'SOLANA', displayContext());

        // Then we expect the sliced substring.
        expect(result).toBe('SOL');
    });

    test('it falls back to raw when amount decimals cannot be resolved', async () => {
        // Given an amount whose injected decimals have no provider.
        const type = numberTypeNode('u64', 'le', {
            display: amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) }),
        });

        // When we format the amount.
        const result = await formatArgumentValue(type, [], 1_000_000n, displayContext());

        // Then we expect the raw value as a string.
        expect(result).toBe('1000000');
    });

    test('it renders a raw number when the type has no display node', async () => {
        // Given a plain number type with no display.
        const type = numberTypeNode('u64');

        // When we format the value.
        const result = await formatArgumentValue(type, [], 42n, displayContext());

        // Then we expect the raw string.
        expect(result).toBe('42');
    });

    test('it renders an empty string for an undefined value rather than the string "undefined"', async () => {
        // Given a plain number type and a missing (undefined) decoded value.
        const type = numberTypeNode('u64');

        // When we format the value.
        const result = await formatArgumentValue(type, [], undefined, displayContext());

        // Then we expect an empty string, not `JSON.stringify(undefined)`.
        expect(result).toBe('');
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
        expect(result).toBe('Buy');
    });

    test('it title-cases a scalar enum variant without a display label', async () => {
        // Given a scalar enum variant with no display.
        const type = enumTypeNode([enumEmptyVariantTypeNode('buyNow'), enumEmptyVariantTypeNode('sell')]);

        // When we format the decoded variant name.
        const result = await formatArgumentValue(type, [], 'buyNow', displayContext());

        // Then we expect the title-cased variant name.
        expect(result).toBe('Buy Now');
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
        expect(result).toBe('Sell');
    });
});
