import { integerTypeNode, structFieldTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes struct fields using their types', () => {
    const codec = getNodeValueCodec([structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u16') })]);
    expect(codec.encode(42)).toStrictEqual(hex('2a00'));
    expect(codec.decode(hex('2a00'))).toBe(42n);
});
