import { numberTypeNode, sizePrefixTypeNode, stringTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV01 } from '../../../src/index.js';

test('it creates string type nodes', t => {
    t.deepEqual(typeNodeFromAnchorV01('string'), sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32')));
});
