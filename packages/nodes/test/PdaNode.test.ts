import test from 'ava';

import { pdaNode } from '../src/index.js';

test('it returns the right node kind', t => {
    const node = pdaNode({ name: 'foo', seeds: [] });
    t.is(node.kind, 'pdaNode');
});

test('it returns a frozen object', t => {
    const node = pdaNode({ name: 'foo', seeds: [] });
    t.true(Object.isFrozen(node));
});
