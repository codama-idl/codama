import test from 'ava';

import { payerValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = payerValueNode();
    t.is(node.kind, 'payerValueNode');
});

test('it returns a frozen object', t => {
    const node = payerValueNode();
    t.true(Object.isFrozen(node));
});
