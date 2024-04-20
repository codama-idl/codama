import test from 'ava';

import { numberValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = numberValueNode(42);
    t.is(node.kind, 'numberValueNode');
});

test('it returns a frozen object', t => {
    const node = numberValueNode(42);
    t.true(Object.isFrozen(node));
});
