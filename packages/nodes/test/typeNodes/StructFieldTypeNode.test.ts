import test from 'ava';

import { numberTypeNode, structFieldTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = structFieldTypeNode({ name: 'age', type: numberTypeNode('u8') });
    t.is(node.kind, 'structFieldTypeNode');
});

test('it returns a frozen object', t => {
    const node = structFieldTypeNode({ name: 'age', type: numberTypeNode('u8') });
    t.true(Object.isFrozen(node));
});
