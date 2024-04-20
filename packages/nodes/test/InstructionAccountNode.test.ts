import test from 'ava';

import { instructionAccountNode } from '../src/index.js';

test('it returns the right node kind', t => {
    const node = instructionAccountNode({ name: 'foo', isSigner: false, isWritable: false });
    t.is(node.kind, 'instructionAccountNode');
});

test('it returns a frozen object', t => {
    const node = instructionAccountNode({ name: 'foo', isSigner: false, isWritable: false });
    t.true(Object.isFrozen(node));
});
