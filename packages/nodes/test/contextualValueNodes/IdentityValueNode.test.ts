import test from 'ava';

import { identityValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = identityValueNode();
    t.is(node.kind, 'identityValueNode');
});

test('it returns a frozen object', t => {
    const node = identityValueNode();
    t.true(Object.isFrozen(node));
});
