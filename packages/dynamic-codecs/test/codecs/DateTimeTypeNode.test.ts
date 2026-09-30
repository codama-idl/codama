import { dateTimeTypeNode, integerTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes date-times as their raw integer', () => {
    const codec = getNodeValueCodec([dateTimeTypeNode(integerTypeNode('i64'))]);
    expect(codec.encode(1_700_000_000n)).toStrictEqual(hex('00f1536500000000'));
    expect(codec.decode(hex('00f1536500000000'))).toBe(1_700_000_000n);
});
