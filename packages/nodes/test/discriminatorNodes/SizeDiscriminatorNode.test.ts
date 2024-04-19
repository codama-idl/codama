import test from 'ava';

import { sizeDiscriminatorNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = sizeDiscriminatorNode(42);
    t.is(node.kind, 'sizeDiscriminatorNode');
});

test('it returns a frozen object', t => {
    const node = sizeDiscriminatorNode(42);
    t.true(Object.isFrozen(node));
});
