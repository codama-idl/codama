import test from 'ava';

import { accountLinkNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = accountLinkNode('token');
    t.is(node.kind, 'accountLinkNode');
});

test('it returns a frozen object', t => {
    const node = accountLinkNode('token');
    t.true(Object.isFrozen(node));
});
