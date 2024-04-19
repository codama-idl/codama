import test from 'ava';

import { tupleTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = tupleTypeNode([]);
    t.is(node.kind, 'tupleTypeNode');
});

test('it returns a frozen object', t => {
    const node = tupleTypeNode([]);
    t.true(Object.isFrozen(node));
});
