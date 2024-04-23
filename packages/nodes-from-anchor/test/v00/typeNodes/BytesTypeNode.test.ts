import { bytesTypeNode, numberTypeNode, sizePrefixTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV00 } from '../../../src/index.js';

test('it creates bytes type nodes', t => {
    t.deepEqual(typeNodeFromAnchorV00('bytes'), sizePrefixTypeNode(bytesTypeNode(), numberTypeNode('u32')));
});
