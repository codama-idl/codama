import test from 'ava';

import { numberTypeNode, optionTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = optionTypeNode(numberTypeNode('u8'));
    t.is(node.kind, 'optionTypeNode');
});

test('it returns a frozen object', t => {
    const node = optionTypeNode(numberTypeNode('u8'));
    t.true(Object.isFrozen(node));
});
