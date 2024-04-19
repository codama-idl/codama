import test from 'ava';

import { numberTypeNode, variablePdaSeedNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = variablePdaSeedNode('edition', numberTypeNode('u64'));
    t.is(node.kind, 'variablePdaSeedNode');
});

test('it returns a frozen object', t => {
    const node = variablePdaSeedNode('edition', numberTypeNode('u64'));
    t.true(Object.isFrozen(node));
});
