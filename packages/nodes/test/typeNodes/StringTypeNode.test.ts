import test from 'ava';

import { stringTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = stringTypeNode('utf8');
    t.is(node.kind, 'stringTypeNode');
});

test('it returns a frozen object', t => {
    const node = stringTypeNode('utf8');
    t.true(Object.isFrozen(node));
});
