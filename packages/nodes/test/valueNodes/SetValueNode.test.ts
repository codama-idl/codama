import test from 'ava';

import { setValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = setValueNode([]);
    t.is(node.kind, 'setValueNode');
});

test('it returns a frozen object', t => {
    const node = setValueNode([]);
    t.true(Object.isFrozen(node));
});
