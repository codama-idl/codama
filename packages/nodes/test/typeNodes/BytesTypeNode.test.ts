import test from 'ava';

import { bytesTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = bytesTypeNode();
    t.is(node.kind, 'bytesTypeNode');
});

test('it returns a frozen object', t => {
    const node = bytesTypeNode();
    t.true(Object.isFrozen(node));
});
