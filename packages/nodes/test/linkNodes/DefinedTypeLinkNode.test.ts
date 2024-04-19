import test from 'ava';

import { definedTypeLinkNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = definedTypeLinkNode('config');
    t.is(node.kind, 'definedTypeLinkNode');
});

test('it returns a frozen object', t => {
    const node = definedTypeLinkNode('config');
    t.true(Object.isFrozen(node));
});
