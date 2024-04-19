import test from 'ava';

import { accountValueNode, argumentValueNode, conditionalValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = conditionalValueNode({ condition: accountValueNode('token'), ifTrue: argumentValueNode('space') });
    t.is(node.kind, 'conditionalValueNode');
});

test('it returns a frozen object', t => {
    const node = conditionalValueNode({ condition: accountValueNode('token'), ifTrue: argumentValueNode('space') });
    t.true(Object.isFrozen(node));
});
