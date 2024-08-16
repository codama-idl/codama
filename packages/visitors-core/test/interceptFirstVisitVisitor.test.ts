import { numberTypeNode, publicKeyTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { extendVisitor, interceptFirstVisitVisitor, visit, voidVisitor } from '../src';

test('it returns a new visitor that only intercepts the first visit of a visitor', () => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // And an intercepted void visitor that records the events that happened during the first visit.
    const events: string[] = [];
    const baseVisitor = voidVisitor();
    const visitor = interceptFirstVisitVisitor(baseVisitor, (node, next) => {
        events.push(`down:${node.kind}`);
        next(node);
        events.push(`up:${node.kind}`);
    });

    // When we visit the tree using that visitor.
    visit(node, visitor);

    // Then we expect the following events to have happened.
    expect(events).toEqual(['down:tupleTypeNode', 'up:tupleTypeNode']);

    // And the intercepted visitor is a new instance.
    expect(baseVisitor).not.toBe(visitor);
});

test('it still works on subsequent calls', () => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // And an intercepted void visitor that records the events that happened during the first visit.
    const events: string[] = [];
    const baseVisitor = voidVisitor();
    const visitor = interceptFirstVisitVisitor(baseVisitor, (node, next) => {
        events.push(`intercepting:${node.kind}`);
        next(node);
    });

    // When we visit the tree twice using that visitor.
    visit(node, visitor);
    visit(node, visitor);

    // Then we expect the following events to have happened.
    expect(events).toEqual(['intercepting:tupleTypeNode', 'intercepting:tupleTypeNode']);
});

test('it resets the first visit boolean if an error is thrown', () => {
    // Given the following 3-nodes tree.
    const node = tupleTypeNode([numberTypeNode('u32'), publicKeyTypeNode()]);

    // And an intercepted visitor that records the events that happened during the first visit
    // but throws an error when it visits publicKeyTypeNodes.
    const events: string[] = [];
    const baseVisitor = extendVisitor(voidVisitor(), {
        visitPublicKeyType: () => {
            throw new Error('public key error');
        },
    });
    const visitor = interceptFirstVisitVisitor(baseVisitor, (node, next) => {
        events.push(`intercepting:${node.kind}`);
        next(node);
    });

    // Then we expect errors to be thrown whenever we visit the three.
    expect(() => visit(node, visitor)).toThrow('public key error');
    expect(() => visit(node, visitor)).toThrow('public key error');

    // But we still expect the following events to have happened.
    expect(events).toEqual(['intercepting:tupleTypeNode', 'intercepting:tupleTypeNode']);
});
