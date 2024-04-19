import test from 'ava';

import { enumEmptyVariantTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = enumEmptyVariantTypeNode('apple');
    t.is(node.kind, 'enumEmptyVariantTypeNode');
});

test('it returns a frozen object', t => {
    const node = enumEmptyVariantTypeNode('apple');
    t.true(Object.isFrozen(node));
});
