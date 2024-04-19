import test from 'ava';

import { constantValueNodeFromBytes, sentinelTypeNode, stringTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = sentinelTypeNode(stringTypeNode('utf8'), constantValueNodeFromBytes('base16', 'ff'));
    t.is(node.kind, 'sentinelTypeNode');
});

test('it returns a frozen object', t => {
    const node = sentinelTypeNode(stringTypeNode('utf8'), constantValueNodeFromBytes('base16', 'ff'));
    t.true(Object.isFrozen(node));
});
