import { bytesTypeNode, numberTypeNode, sizePrefixTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates bytes type nodes', () => {
    expect(typeNodeFromAnchorV00('bytes')).toEqual(sizePrefixTypeNode(bytesTypeNode(), numberTypeNode('u32')));
});
