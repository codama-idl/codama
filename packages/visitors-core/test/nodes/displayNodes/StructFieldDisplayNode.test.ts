import { integerValueNode, structFieldDisplayNode, valueLabelDisplayNode } from '@codama/nodes';
import { test } from 'vitest';

import {
    expectDebugStringVisitor,
    expectDeleteNodesVisitor,
    expectIdentityVisitor,
    expectMergeVisitorCount,
} from '../_setup';

const node = structFieldDisplayNode({ label: 'Amount', skip: 'never' });

test('mergeVisitor', () => {
    expectMergeVisitorCount(node, 1);
});

test('identityVisitor', () => {
    expectIdentityVisitor(node);
});

test('deleteNodesVisitor', () => {
    expectDeleteNodesVisitor(node, '[structFieldDisplayNode]', null);
});

test('debugStringVisitor', () => {
    expectDebugStringVisitor(node, `structFieldDisplayNode`);
});

test('it visits the value labels of struct fields', () => {
    const valueLabel = valueLabelDisplayNode({ label: 'All', value: integerValueNode('18446744073709551615') });
    const labelledNode = structFieldDisplayNode({ label: 'Amount', valueLabels: [valueLabel] });
    expectMergeVisitorCount(labelledNode, 3);
    expectIdentityVisitor(labelledNode);
    expectDeleteNodesVisitor(labelledNode, '[valueLabelDisplayNode]', structFieldDisplayNode({ label: 'Amount' }));
});
