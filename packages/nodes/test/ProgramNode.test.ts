import test from 'ava';

import { programNode } from '../src/index.js';

test('it returns the right node kind', t => {
    const node = programNode({ name: 'foo', publicKey: '1111' });
    t.is(node.kind, 'programNode');
});

test('it returns a frozen object', t => {
    const node = programNode({ name: 'foo', publicKey: '1111' });
    t.true(Object.isFrozen(node));
});
