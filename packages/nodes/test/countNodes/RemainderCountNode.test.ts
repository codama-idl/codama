import test from 'ava';

import { remainderCountNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = remainderCountNode();
    t.is(node.kind, 'remainderCountNode');
});

test('it returns a frozen object', t => {
    const node = remainderCountNode();
    t.true(Object.isFrozen(node));
});
