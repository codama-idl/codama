import type { Node } from '@codama/nodes';
import { expect } from 'vitest';

import {
    deleteNodesVisitor,
    getDebugStringVisitor,
    identityVisitor,
    mergeVisitor,
    NodeSelector,
    visit,
} from '../../src';

export const expectMergeVisitorCount = (node: Node, expectedNodeCount: number) => {
    const visitor = mergeVisitor(
        () => 1,
        (_, values) => values.reduce((a, b) => a + b, 1),
    );
    const result = visit(node, visitor);
    expect(result).toBe(expectedNodeCount);
};

export const expectIdentityVisitor = (node: Node) => {
    const visitor = identityVisitor();
    const result = visit(node, visitor);
    expect(result).toEqual(node);
    expect(result).not.toBe(node);
    expect(Object.isFrozen(result)).toBe(true);
};

export const expectDeleteNodesVisitor = (
    node: Node,
    selector: NodeSelector | NodeSelector[],
    expectedResult: Node | null,
) => {
    const selectors = Array.isArray(selector) ? selector : [selector];
    const visitor = deleteNodesVisitor(selectors);
    const result = visit(node, visitor);
    if (expectedResult === null) {
        expect(result).toBeNull();
    } else {
        expect(result).toEqual(expectedResult);
        expect(result).not.toBe(expectedResult);
        expect(Object.isFrozen(result)).toBe(true);
    }
};

export const expectDebugStringVisitor = (node: Node, expectedIndentedString: string) => {
    const visitor = getDebugStringVisitor({ indent: true });
    const result = visit(node, visitor);
    expect(result).toBe(expectedIndentedString.trim());
};
