import test from 'ava';

import { arrayTypeNode, numberTypeNode, remainderCountNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = arrayTypeNode(numberTypeNode('u64'), remainderCountNode());
    t.is(node.kind, 'arrayTypeNode');
});

test('it returns a frozen object', t => {
    const node = arrayTypeNode(numberTypeNode('u64'), remainderCountNode());
    t.true(Object.isFrozen(node));
});
