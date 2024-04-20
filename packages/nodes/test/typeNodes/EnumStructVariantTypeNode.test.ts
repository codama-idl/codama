import test from 'ava';

import { enumStructVariantTypeNode, structTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = enumStructVariantTypeNode('apple', structTypeNode([]));
    t.is(node.kind, 'enumStructVariantTypeNode');
});

test('it returns a frozen object', t => {
    const node = enumStructVariantTypeNode('apple', structTypeNode([]));
    t.true(Object.isFrozen(node));
});
