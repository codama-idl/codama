import {
    fixedSizeTransformNode,
    integerTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes structs', () => {
    const codec = getNodeValueCodec([
        structTypeNode([
            structFieldTypeNode({
                identifier: 'firstname',
                type: stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(5)] }),
            }),
            structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u16') }),
        ]),
    ]);
    expect(codec.encode({ age: 42, firstname: 'Alice' })).toStrictEqual(hex('416c6963652a00'));
    expect(codec.decode(hex('416c6963652a00'))).toStrictEqual({ age: 42n, firstname: 'Alice' });
});

test('it uses the raw field identifiers', () => {
    const codec = getNodeValueCodec([
        structTypeNode([structFieldTypeNode({ identifier: 'my_field', type: integerTypeNode('u8') })]),
    ]);
    expect(codec.encode({ my_field: 42 })).toStrictEqual(hex('2a'));
    expect(codec.decode(hex('2a'))).toStrictEqual({ my_field: 42n });
});
