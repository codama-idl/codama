import { argumentValueNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = argumentValueNode('space');

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[argumentValueNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `argumentValueNode [space]`);
});

test('debugStringVisitor with path', () => {
    expectDebugStringVisitor(argumentValueNode('plan_data', ['plan_id']), `argumentValueNode [planData.planId]`);
});

test('identityVisitor with path', () => {
    expectIdentityVisitor(argumentValueNode('plan_data', ['plan_id']));
});
