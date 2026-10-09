import { floatTypeNode, injectedValueNode, unitNumberDisplayNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { formatFloat, getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it formats floats as their value', () => {
    const decoded = getNodeCodec([floatTypeNode('f32')]).decode(hex('0000c03f'));
    expect(formatFloat(decoded)).toBe('1.5');
});

test('it formats floats with the unit of their display over the one of their type', () => {
    const display = unitNumberDisplayNode({ unit: injectedValueNode({ key: 'currency' }) });
    const decoded = getNodeCodec([floatTypeNode('f32', { display, unit: 'USD' })]).decode(hex('0000c03f'));
    expect(formatFloat(decoded, { resolveInjectedValue: () => 'EUR' })).toBe('1.5 EUR');
});

test('it formats floats with the unit of their type when their display unit cannot be resolved', () => {
    const display = unitNumberDisplayNode({ unit: injectedValueNode({ key: 'currency' }) });
    const decoded = getNodeCodec([floatTypeNode('f32', { display, unit: 'USD' })]).decode(hex('0000c03f'));
    expect(formatFloat(decoded)).toBe('1.5 USD');
});
