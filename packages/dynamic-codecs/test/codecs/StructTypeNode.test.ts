import { fixedSizeTypeNode, numberTypeNode, stringTypeNode, structFieldTypeNode, structTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes structs', () => {
    const codec = getNodeCodec([
        structTypeNode([
            structFieldTypeNode({ name: 'firstname', type: fixedSizeTypeNode(stringTypeNode('utf8'), 5) }),
            structFieldTypeNode({ name: 'age', type: numberTypeNode('u16') }),
        ]),
    ]);
    const person = { age: 42, firstname: 'Alice' };
    expect(codec.encode(person)).toStrictEqual(hex('416c6963652a00'));
    expect(codec.decode(hex('416c6963652a00'))).toStrictEqual(person);
});
