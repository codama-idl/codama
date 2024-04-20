import test from 'ava';

import { enumTupleVariantTypeNode, tupleTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = enumTupleVariantTypeNode('apple', tupleTypeNode([]));
    t.is(node.kind, 'enumTupleVariantTypeNode');
});

test('it returns a frozen object', t => {
    const node = enumTupleVariantTypeNode('apple', tupleTypeNode([]));
    t.true(Object.isFrozen(node));
});
