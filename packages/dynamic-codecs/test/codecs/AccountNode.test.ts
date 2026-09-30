import { accountNode, integerTypeNode, structFieldTypeNode, structTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it delegates to the underlying data node', () => {
    const codec = getNodeValueCodec([
        accountNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'foo', type: integerTypeNode('u32') })]),
            identifier: 'myAccount',
        }),
    ]);
    expect(codec.encode({ foo: 42 })).toStrictEqual(hex('2a000000'));
    expect(codec.decode(hex('2a000000'))).toStrictEqual({ foo: 42n });
});
