import test from 'ava';

import { numberTypeNode, postOffsetTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = postOffsetTypeNode(numberTypeNode('u8'), 42);
    t.is(node.kind, 'postOffsetTypeNode');
});

test('it returns a frozen object', t => {
    const node = postOffsetTypeNode(numberTypeNode('u8'), 42);
    t.true(Object.isFrozen(node));
});
