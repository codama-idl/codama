import test from 'ava';

import { resolverValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = resolverValueNode('foo');
    t.is(node.kind, 'resolverValueNode');
});

test('it returns a frozen object', t => {
    const node = resolverValueNode('foo');
    t.true(Object.isFrozen(node));
});
