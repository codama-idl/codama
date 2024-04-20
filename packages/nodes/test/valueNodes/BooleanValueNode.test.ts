import test from 'ava';

import { booleanValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = booleanValueNode(true);
    t.is(node.kind, 'booleanValueNode');
});

test('it returns a frozen object', t => {
    const node = booleanValueNode(true);
    t.true(Object.isFrozen(node));
});
