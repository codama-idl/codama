import {
    constantValueNode,
    fixedSizeTransformNode,
    hiddenPrefixTransformNode,
    integerTypeNode,
    integerValueNode,
    stringTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../../src';
import { hex } from '../../_setup';

test('it hides hidden prefixes from the main type', () => {
    const prefix = hiddenPrefixTransformNode([constantValueNode(integerTypeNode('u64'), integerValueNode('42'))]);
    const codec = getNodeValueCodec([stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(5), prefix] })]);
    expect(codec.encode('Alice')).toStrictEqual(hex('2a00000000000000416c696365'));
    expect(codec.decode(hex('2a00000000000000416c696365'))).toBe('Alice');
});
