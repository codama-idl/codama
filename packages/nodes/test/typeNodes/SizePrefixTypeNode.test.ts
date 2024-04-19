import test from 'ava';

import { numberTypeNode, sizePrefixTypeNode, stringTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32'));
    t.is(node.kind, 'sizePrefixTypeNode');
});

test('it returns a frozen object', t => {
    const node = sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32'));
    t.true(Object.isFrozen(node));
});
