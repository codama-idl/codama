import { booleanTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { formatBoolean, getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it formats true booleans', () => {
    const decoded = getNodeCodec([booleanTypeNode()]).decode(hex('01'));
    expect(formatBoolean(decoded)).toBe('true');
});

test('it formats false booleans', () => {
    const decoded = getNodeCodec([booleanTypeNode()]).decode(hex('00'));
    expect(formatBoolean(decoded)).toBe('false');
});
