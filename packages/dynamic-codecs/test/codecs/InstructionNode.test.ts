import { instructionArgumentNode, instructionNode, numberTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it delegates to the instruction arguments as a struct', () => {
    const codec = getNodeCodec([
        instructionNode({
            arguments: [
                instructionArgumentNode({
                    name: 'foo',
                    type: numberTypeNode('u32'),
                }),
            ],
            name: 'myInstruction',
        }),
    ]);
    expect(codec.encode({ foo: 42 })).toStrictEqual(hex('2a000000'));
    expect(codec.decode(hex('2a000000'))).toStrictEqual({ foo: 42 });
});
