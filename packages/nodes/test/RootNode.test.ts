import type { KinobiVersion } from '@kinobi-so/node-types';
import test from 'ava';

import { programNode, rootNode } from '../src/index.js';

test('it returns the right node kind', t => {
    const root = rootNode(programNode({ name: 'foo', publicKey: '1111' }));
    t.is(root.kind, 'rootNode');
});

test('it returns the right Kinobi standard', t => {
    const root = rootNode(programNode({ name: 'foo', publicKey: '1111' }));
    t.is(root.standard, 'kinobi');
});

test('it returns the right Kinobi version', t => {
    const root = rootNode(programNode({ name: 'foo', publicKey: '1111' }));
    t.is(root.version, __VERSION__ as KinobiVersion);
});

test('it returns a frozen object', t => {
    const root = rootNode(programNode({ name: 'foo', publicKey: '1111' }));
    t.true(Object.isFrozen(root));
});
