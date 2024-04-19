import test from 'ava';

import { definedTypeNode, structTypeNode } from '../src/index.js';

test('it returns the right node kind', t => {
    const node = definedTypeNode({ name: 'foo', type: structTypeNode([]) });
    t.is(node.kind, 'definedTypeNode');
});

test('it returns a frozen object', t => {
    const node = definedTypeNode({ name: 'foo', type: structTypeNode([]) });
    t.true(Object.isFrozen(node));
});
