import test from 'ava';

import { accountValueNode, pdaSeedValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = pdaSeedValueNode('token', accountValueNode('token'));
    t.is(node.kind, 'pdaSeedValueNode');
});

test('it returns a frozen object', t => {
    const node = pdaSeedValueNode('token', accountValueNode('token'));
    t.true(Object.isFrozen(node));
});
