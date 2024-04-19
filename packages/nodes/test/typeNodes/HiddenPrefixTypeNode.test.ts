import test from 'ava';

import { hiddenPrefixTypeNode, numberTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = hiddenPrefixTypeNode(numberTypeNode('u8'), []);
    t.is(node.kind, 'hiddenPrefixTypeNode');
});

test('it returns a frozen object', t => {
    const node = hiddenPrefixTypeNode(numberTypeNode('u8'), []);
    t.true(Object.isFrozen(node));
});
