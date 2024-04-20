import test from 'ava';

import { programIdValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = programIdValueNode();
    t.is(node.kind, 'programIdValueNode');
});

test('it returns a frozen object', t => {
    const node = programIdValueNode();
    t.true(Object.isFrozen(node));
});
