import test from 'ava';

import { enumValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = enumValueNode('fruit', 'apple');
    t.is(node.kind, 'enumValueNode');
});

test('it returns a frozen object', t => {
    const node = enumValueNode('fruit', 'apple');
    t.true(Object.isFrozen(node));
});
