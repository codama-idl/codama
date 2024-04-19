import test from 'ava';

import { dateTimeTypeNode, numberTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = dateTimeTypeNode(numberTypeNode('u64'));
    t.is(node.kind, 'dateTimeTypeNode');
});

test('it returns a frozen object', t => {
    const node = dateTimeTypeNode(numberTypeNode('u64'));
    t.true(Object.isFrozen(node));
});
