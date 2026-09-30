import {
    constantValueNode,
    fixedSizeTransformNode,
    hiddenSuffixTransformNode,
    integerTypeNode,
    integerValueNode,
    stringTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../../src';
import { hex } from '../../_setup';

test('it hides hidden suffixes from the main type', () => {
    const suffix = hiddenSuffixTransformNode([constantValueNode(integerTypeNode('u64'), integerValueNode('42'))]);
    const codec = getNodeValueCodec([stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(5), suffix] })]);
    expect(codec.encode('Alice')).toStrictEqual(hex('416c6963652a00000000000000'));
    expect(codec.decode(hex('416c6963652a00000000000000'))).toBe('Alice');
});
