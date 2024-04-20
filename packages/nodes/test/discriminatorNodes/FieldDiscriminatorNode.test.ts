import test from 'ava';

import { fieldDiscriminatorNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = fieldDiscriminatorNode('discriminator');
    t.is(node.kind, 'fieldDiscriminatorNode');
});

test('it returns a frozen object', t => {
    const node = fieldDiscriminatorNode('discriminator');
    t.true(Object.isFrozen(node));
});
