import test from 'ava';

import { constantPdaSeedNode, numberTypeNode, numberValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = constantPdaSeedNode(numberTypeNode('u64'), numberValueNode(42));
    t.is(node.kind, 'constantPdaSeedNode');
});

test('it returns a frozen object', t => {
    const node = constantPdaSeedNode(numberTypeNode('u64'), numberValueNode(42));
    t.true(Object.isFrozen(node));
});
