import test from 'ava';

import { errorNode } from '../src/index.js';

test('it returns the right node kind', t => {
    const node = errorNode({ name: 'foo', code: 42, message: 'error message' });
    t.is(node.kind, 'errorNode');
});

test('it returns a frozen object', t => {
    const node = errorNode({ name: 'foo', code: 42, message: 'error message' });
    t.true(Object.isFrozen(node));
});
