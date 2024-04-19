import test from 'ava';

import { publicKeyTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = publicKeyTypeNode();
    t.is(node.kind, 'publicKeyTypeNode');
});

test('it returns a frozen object', t => {
    const node = publicKeyTypeNode();
    t.true(Object.isFrozen(node));
});
