import { instructionArgumentNode, numberTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it delegates to the type node of the argument', () => {
    const codec = getNodeCodec([
        instructionArgumentNode({
            name: 'foo',
            type: numberTypeNode('u32'),
        }),
    ]);
    expect(codec.encode(42)).toStrictEqual(hex('2a000000'));
    expect(codec.decode(hex('2a000000'))).toStrictEqual(42);
});
