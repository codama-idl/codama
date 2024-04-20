import test from 'ava';

import { constantValueNode, numberTypeNode, numberValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = constantValueNode(numberTypeNode('u8'), numberValueNode(42));
    t.is(node.kind, 'constantValueNode');
});

test('it returns a frozen object', t => {
    const node = constantValueNode(numberTypeNode('u8'), numberValueNode(42));
    t.true(Object.isFrozen(node));
});
