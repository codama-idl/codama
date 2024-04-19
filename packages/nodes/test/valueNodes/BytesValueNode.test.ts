import test from 'ava';

import { bytesValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = bytesValueNode('utf8', 'hello world');
    t.is(node.kind, 'bytesValueNode');
});

test('it returns a frozen object', t => {
    const node = bytesValueNode('utf8', 'hello world');
    t.true(Object.isFrozen(node));
});
