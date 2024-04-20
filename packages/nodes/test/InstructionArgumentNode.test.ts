import test from 'ava';

import { instructionArgumentNode, structTypeNode } from '../src/index.js';

test('it returns the right node kind', t => {
    const node = instructionArgumentNode({ name: 'foo', type: structTypeNode([]) });
    t.is(node.kind, 'instructionArgumentNode');
});

test('it returns a frozen object', t => {
    const node = instructionArgumentNode({ name: 'foo', type: structTypeNode([]) });
    t.true(Object.isFrozen(node));
});
