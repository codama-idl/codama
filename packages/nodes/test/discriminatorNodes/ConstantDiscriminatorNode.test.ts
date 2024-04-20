import test from 'ava';

import { constantDiscriminatorNode, constantValueNodeFromBytes } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'aabbccdd'));
    t.is(node.kind, 'constantDiscriminatorNode');
});

test('it returns a frozen object', t => {
    const node = constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'aabbccdd'));
    t.true(Object.isFrozen(node));
});
