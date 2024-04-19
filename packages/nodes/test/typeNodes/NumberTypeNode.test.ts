import test from 'ava';

import { numberTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = numberTypeNode('u8');
    t.is(node.kind, 'numberTypeNode');
});

test('it returns a frozen object', t => {
    const node = numberTypeNode('u8');
    t.true(Object.isFrozen(node));
});
