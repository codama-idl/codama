import test from 'ava';

import { stringValueNode, structFieldValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = structFieldValueNode('name', stringValueNode('Alice'));
    t.is(node.kind, 'structFieldValueNode');
});

test('it returns a frozen object', t => {
    const node = structFieldValueNode('name', stringValueNode('Alice'));
    t.true(Object.isFrozen(node));
});
