import test from 'ava';

import { fixedSizeTypeNode, stringTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = fixedSizeTypeNode(stringTypeNode('utf8'), 42);
    t.is(node.kind, 'fixedSizeTypeNode');
});

test('it returns a frozen object', t => {
    const node = fixedSizeTypeNode(stringTypeNode('utf8'), 42);
    t.true(Object.isFrozen(node));
});
