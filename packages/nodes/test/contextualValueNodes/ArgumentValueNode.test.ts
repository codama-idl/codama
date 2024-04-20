import test from 'ava';

import { argumentValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = argumentValueNode('space');
    t.is(node.kind, 'argumentValueNode');
});

test('it returns a frozen object', t => {
    const node = argumentValueNode('space');
    t.true(Object.isFrozen(node));
});
