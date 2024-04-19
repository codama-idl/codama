import test from 'ava';

import { enumTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = enumTypeNode([]);
    t.is(node.kind, 'enumTypeNode');
});

test('it returns a frozen object', t => {
    const node = enumTypeNode([]);
    t.true(Object.isFrozen(node));
});
