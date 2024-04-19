import test from 'ava';

import { instructionNode } from '../src/index.js';

test('it returns the right node kind', t => {
    const node = instructionNode({ name: 'foo' });
    t.is(node.kind, 'instructionNode');
});

test('it returns a frozen object', t => {
    const node = instructionNode({ name: 'foo' });
    t.true(Object.isFrozen(node));
});
