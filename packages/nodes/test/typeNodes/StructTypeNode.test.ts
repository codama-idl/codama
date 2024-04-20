import test from 'ava';

import { structTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = structTypeNode([]);
    t.is(node.kind, 'structTypeNode');
});

test('it returns a frozen object', t => {
    const node = structTypeNode([]);
    t.true(Object.isFrozen(node));
});
