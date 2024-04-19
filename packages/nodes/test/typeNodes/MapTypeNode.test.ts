import test from 'ava';

import { mapTypeNode, numberTypeNode, remainderCountNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = mapTypeNode(numberTypeNode('u8'), numberTypeNode('u64'), remainderCountNode());
    t.is(node.kind, 'mapTypeNode');
});

test('it returns a frozen object', t => {
    const node = mapTypeNode(numberTypeNode('u8'), numberTypeNode('u64'), remainderCountNode());
    t.true(Object.isFrozen(node));
});
