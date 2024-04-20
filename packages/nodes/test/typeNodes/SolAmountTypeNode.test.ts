import test from 'ava';

import { numberTypeNode, solAmountTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = solAmountTypeNode(numberTypeNode('u32'));
    t.is(node.kind, 'solAmountTypeNode');
});

test('it returns a frozen object', t => {
    const node = solAmountTypeNode(numberTypeNode('u32'));
    t.true(Object.isFrozen(node));
});
