import { bytesTypeNode, numberTypeNode, sizePrefixTypeNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV01 } from '../../../src/index.js';

test('it creates bytes type nodes', () => {
    expect(typeNodeFromAnchorV01('bytes')).toEqual(sizePrefixTypeNode(bytesTypeNode(), numberTypeNode('u32')));
});
