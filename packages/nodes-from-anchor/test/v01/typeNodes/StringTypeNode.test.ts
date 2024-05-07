import { numberTypeNode, sizePrefixTypeNode, stringTypeNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV01 } from '../../../src/index.js';

test('it creates string type nodes', () => {
    expect(typeNodeFromAnchorV01('string')).toEqual(sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32')));
});
