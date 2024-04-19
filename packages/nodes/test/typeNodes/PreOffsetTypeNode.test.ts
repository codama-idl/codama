import test from 'ava';

import { numberTypeNode, preOffsetTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = preOffsetTypeNode(numberTypeNode('u8'), 42);
    t.is(node.kind, 'preOffsetTypeNode');
});

test('it returns a frozen object', t => {
    const node = preOffsetTypeNode(numberTypeNode('u8'), 42);
    t.true(Object.isFrozen(node));
});
