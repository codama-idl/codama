import { fieldDiscriminatorNode } from '@kinobi-so/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = fieldDiscriminatorNode('discriminator', 42);

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[fieldDiscriminatorNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `fieldDiscriminatorNode [discriminator.offset:42]`);
});
