import test from 'ava';

import { tupleValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = tupleValueNode([]);
    t.is(node.kind, 'tupleValueNode');
});

test('it returns a frozen object', t => {
    const node = tupleValueNode([]);
    t.true(Object.isFrozen(node));
});
