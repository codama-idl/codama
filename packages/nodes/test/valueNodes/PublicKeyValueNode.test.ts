import test from 'ava';

import { publicKeyValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = publicKeyValueNode('1111');
    t.is(node.kind, 'publicKeyValueNode');
});

test('it returns a frozen object', t => {
    const node = publicKeyValueNode('1111');
    t.true(Object.isFrozen(node));
});
