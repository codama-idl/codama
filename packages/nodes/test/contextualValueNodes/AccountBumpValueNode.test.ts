import test from 'ava';

import { accountBumpValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = accountBumpValueNode('associatedToken');
    t.is(node.kind, 'accountBumpValueNode');
});

test('it returns a frozen object', t => {
    const node = accountBumpValueNode('associatedToken');
    t.true(Object.isFrozen(node));
});
