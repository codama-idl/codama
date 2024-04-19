import test from 'ava';

import { pdaValueNode } from '../../src/index.js';

test('it returns the right node kind', t => {
    const node = pdaValueNode('associatedToken', []);
    t.is(node.kind, 'pdaValueNode');
});

test('it returns a frozen object', t => {
    const node = pdaValueNode('associatedToken', []);
    t.true(Object.isFrozen(node));
});
