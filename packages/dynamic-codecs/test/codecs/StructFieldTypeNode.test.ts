import { numberTypeNode, structFieldTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes struct fields using their types', () => {
    const codec = getNodeCodec([structFieldTypeNode({ name: 'age', type: numberTypeNode('u16') })]);
    expect(codec.encode(42)).toStrictEqual(hex('2a00'));
    expect(codec.decode(hex('2a00'))).toStrictEqual(42);
});
