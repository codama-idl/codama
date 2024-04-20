import test from 'ava';

import { structValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = structValueNode([]);
    t.is(node.kind, 'structValueNode');
});

test('it returns a frozen object', t => {
    const node = structValueNode([]);
    t.true(Object.isFrozen(node));
});
