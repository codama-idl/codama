import test from 'ava';

import { numberTypeNode, prefixedCountNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = prefixedCountNode(numberTypeNode('u32'));
    t.is(node.kind, 'prefixedCountNode');
});

test('it returns a frozen object', t => {
    const node = prefixedCountNode(numberTypeNode('u32'));
    t.true(Object.isFrozen(node));
});
