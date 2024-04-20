import test from 'ava';

import { amountTypeNode, numberTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = amountTypeNode(numberTypeNode('u64'), 9);
    t.is(node.kind, 'amountTypeNode');
});

test('it returns a frozen object', t => {
    const node = amountTypeNode(numberTypeNode('u64'), 9);
    t.true(Object.isFrozen(node));
});
