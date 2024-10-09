import { numberTypeNode, sizePrefixTypeNode, stringTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates string type nodes', () => {
    expect(typeNodeFromAnchorV00('string')).toEqual(sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32')));
});
