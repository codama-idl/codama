import test from 'ava';

import { mapValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = mapValueNode([]);
    t.is(node.kind, 'mapValueNode');
});

test('it returns a frozen object', t => {
    const node = mapValueNode([]);
    t.true(Object.isFrozen(node));
});
