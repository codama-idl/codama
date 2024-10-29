import { accountNode, numberTypeNode, structFieldTypeNode, structTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it delegates to the underlying data node', () => {
    const codec = getNodeCodec([
        accountNode({
            data: structTypeNode([
                structFieldTypeNode({
                    name: 'foo',
                    type: numberTypeNode('u32'),
                }),
            ]),
            name: 'myAccount',
        }),
    ]);
    expect(codec.encode({ foo: 42 })).toStrictEqual(hex('2a000000'));
    expect(codec.decode(hex('2a000000'))).toStrictEqual({ foo: 42 });
});
