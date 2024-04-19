import test from 'ava';

import { numberValueNode, someValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = someValueNode(numberValueNode(42));
    t.is(node.kind, 'someValueNode');
});

test('it returns a frozen object', t => {
    const node = someValueNode(numberValueNode(42));
    t.true(Object.isFrozen(node));
});
