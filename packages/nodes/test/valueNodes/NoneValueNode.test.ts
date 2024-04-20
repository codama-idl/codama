import test from 'ava';

import { noneValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = noneValueNode();
    t.is(node.kind, 'noneValueNode');
});

test('it returns a frozen object', t => {
    const node = noneValueNode();
    t.true(Object.isFrozen(node));
});
