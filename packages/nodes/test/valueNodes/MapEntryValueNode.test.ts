import test from 'ava';

import { mapEntryValueNode, numberValueNode, stringValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = mapEntryValueNode(stringValueNode('age'), numberValueNode(42));
    t.is(node.kind, 'mapEntryValueNode');
});

test('it returns a frozen object', t => {
    const node = mapEntryValueNode(stringValueNode('age'), numberValueNode(42));
    t.true(Object.isFrozen(node));
});
