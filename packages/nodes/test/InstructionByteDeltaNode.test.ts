import test from 'ava';

import { instructionByteDeltaNode, numberValueNode } from '../src/index.js';

test('it returns the right node kind', t => {
    const node = instructionByteDeltaNode(numberValueNode(42));
    t.is(node.kind, 'instructionByteDeltaNode');
});

test('it returns a frozen object', t => {
    const node = instructionByteDeltaNode(numberValueNode(42));
    t.true(Object.isFrozen(node));
});
