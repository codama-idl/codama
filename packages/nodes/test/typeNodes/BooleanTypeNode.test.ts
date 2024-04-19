import test from 'ava';

import { booleanTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = booleanTypeNode();
    t.is(node.kind, 'booleanTypeNode');
});

test('it returns a frozen object', t => {
    const node = booleanTypeNode();
    t.true(Object.isFrozen(node));
});
