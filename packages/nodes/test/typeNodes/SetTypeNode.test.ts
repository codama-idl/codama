import test from 'ava';

import { numberTypeNode, remainderCountNode, setTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = setTypeNode(numberTypeNode('u64'), remainderCountNode());
    t.is(node.kind, 'setTypeNode');
});

test('it returns a frozen object', t => {
    const node = setTypeNode(numberTypeNode('u64'), remainderCountNode());
    t.true(Object.isFrozen(node));
});
