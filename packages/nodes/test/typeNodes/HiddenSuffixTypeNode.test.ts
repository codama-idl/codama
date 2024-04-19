import test from 'ava';

import { hiddenSuffixTypeNode, numberTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = hiddenSuffixTypeNode(numberTypeNode('u8'), []);
    t.is(node.kind, 'hiddenSuffixTypeNode');
});

test('it returns a frozen object', t => {
    const node = hiddenSuffixTypeNode(numberTypeNode('u8'), []);
    t.true(Object.isFrozen(node));
});
