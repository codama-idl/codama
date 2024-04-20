import test from 'ava';

import { programLinkNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = programLinkNode('system');
    t.is(node.kind, 'programLinkNode');
});

test('it returns a frozen object', t => {
    const node = programLinkNode('system');
    t.true(Object.isFrozen(node));
});
