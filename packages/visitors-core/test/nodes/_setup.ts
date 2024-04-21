import type { Node } from '@kinobi-so/nodes';
import test from 'ava';

import {
    deleteNodesVisitor,
    getDebugStringVisitor,
    identityVisitor,
    mergeVisitor,
    NodeSelector,
    visit,
} from '../../src/index.js';

export const mergeVisitorMacro = test.macro({
    exec(t, node: Node, expectedNodeCount: number) {
        const visitor = mergeVisitor(
            () => 1,
            (_, values) => values.reduce((a, b) => a + b, 1),
        );
        const result = visit(node, visitor);
        t.is(result, expectedNodeCount);
    },
    title: title => title ?? 'mergeVisitor',
});

export const identityVisitorMacro = test.macro({
    exec(t, node: Node) {
        const visitor = identityVisitor();
        const result = visit(node, visitor);
        t.deepEqual(result, node);
        t.not(result, node);
        t.true(Object.isFrozen(result));
    },
    title: title => title ?? 'identityVisitor',
});

export const deleteNodesVisitorMacro = test.macro({
    exec(t, node: Node, selector: NodeSelector | NodeSelector[], expectedResult: Node | null) {
        const selectors = Array.isArray(selector) ? selector : [selector];
        const visitor = deleteNodesVisitor(selectors);
        const result = visit(node, visitor);
        if (expectedResult === null) {
            t.is(result, null);
        } else {
            t.deepEqual(result, expectedResult);
            t.not(result, expectedResult);
            t.true(Object.isFrozen(result));
        }
    },
    title(title, _node, selector: NodeSelector | NodeSelector[]) {
        const selectors = Array.isArray(selector) ? selector : [selector];
        return title ?? `deleteNodesVisitor: ${selectors.join(', ')}`;
    },
});

export const getDebugStringVisitorMacro = test.macro({
    exec(t, node: Node, expectedIndentedString: string) {
        const visitor = getDebugStringVisitor({ indent: true });
        const result = visit(node, visitor);
        t.is(result, expectedIndentedString.trim());
    },
    title: title => title ?? 'getDebugStringVisitor',
});
