import test from 'ava';

import { publicKeyTypeNode, zeroableOptionTypeNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = zeroableOptionTypeNode(publicKeyTypeNode());
    t.is(node.kind, 'zeroableOptionTypeNode');
});

test('it returns a frozen object', t => {
    const node = zeroableOptionTypeNode(publicKeyTypeNode());
    t.true(Object.isFrozen(node));
});
