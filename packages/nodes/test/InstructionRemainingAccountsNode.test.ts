import test from 'ava';

import { argumentValueNode, instructionRemainingAccountsNode } from '../src/index.js';

test('it returns the right node kind', t => {
    const node = instructionRemainingAccountsNode(argumentValueNode('foo'));
    t.is(node.kind, 'instructionRemainingAccountsNode');
});

test('it returns a frozen object', t => {
    const node = instructionRemainingAccountsNode(argumentValueNode('foo'));
    t.true(Object.isFrozen(node));
});
