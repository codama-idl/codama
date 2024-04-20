import test from 'ava';

import { arrayValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = arrayValueNode([]);
    t.is(node.kind, 'arrayValueNode');
});

test('it returns a frozen object', t => {
    const node = arrayValueNode([]);
    t.true(Object.isFrozen(node));
});
