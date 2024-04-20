import test from 'ava';

import { accountValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = accountValueNode('mint');
    t.is(node.kind, 'accountValueNode');
});

test('it returns a frozen object', t => {
    const node = accountValueNode('mint');
    t.true(Object.isFrozen(node));
});
