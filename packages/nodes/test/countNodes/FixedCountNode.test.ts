import test from 'ava';

import { fixedCountNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = fixedCountNode(42);
    t.is(node.kind, 'fixedCountNode');
});

test('it returns a frozen object', t => {
    const node = fixedCountNode(42);
    t.true(Object.isFrozen(node));
});
