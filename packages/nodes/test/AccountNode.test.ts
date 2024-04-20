import test from 'ava';

import { accountNode } from '../src/index.js';

test('it returns the right node kind', t => {
    const node = accountNode({ name: 'foo' });
    t.is(node.kind, 'accountNode');
});

test('it returns a frozen object', t => {
    const node = accountNode({ name: 'foo' });
    t.true(Object.isFrozen(node));
});
