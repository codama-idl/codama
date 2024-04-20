import test from 'ava';

import { stringValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = stringValueNode('hello world');
    t.is(node.kind, 'stringValueNode');
});

test('it returns a frozen object', t => {
    const node = stringValueNode('hello world');
    t.true(Object.isFrozen(node));
});
