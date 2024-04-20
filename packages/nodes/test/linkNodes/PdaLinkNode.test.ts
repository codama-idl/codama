import test from 'ava';

import { pdaLinkNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = pdaLinkNode('associatedToken');
    t.is(node.kind, 'pdaLinkNode');
});

test('it returns a frozen object', t => {
    const node = pdaLinkNode('associatedToken');
    t.true(Object.isFrozen(node));
});
