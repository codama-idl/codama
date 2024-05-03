import { describe, expect, test } from 'vitest';

import {
    assertIsNode,
    assertIsNodeFilter,
    isNode,
    isNodeFilter,
    numberTypeNode,
    publicKeyTypeNode,
    removeNullAndAssertIsNodeFilter,
    tupleTypeNode,
} from '../src';

describe('isNode', () => {
    test('it checks if a given node is of the given kind', () => {
        expect(isNode(tupleTypeNode([]), 'tupleTypeNode')).toBe(true);
        expect(isNode(publicKeyTypeNode(), 'tupleTypeNode')).toBe(false);
        expect(isNode(null, 'tupleTypeNode')).toBe(false);
    });

    test('it checks if a given node is part of the given kinds', () => {
        expect(isNode(tupleTypeNode([]), ['tupleTypeNode', 'publicKeyTypeNode'])).toBe(true);
        expect(isNode(publicKeyTypeNode(), ['tupleTypeNode', 'publicKeyTypeNode'])).toBe(true);
        expect(isNode(numberTypeNode('u8'), ['tupleTypeNode', 'publicKeyTypeNode'])).toBe(false);
        expect(isNode(null, ['tupleTypeNode', 'publicKeyTypeNode'])).toBe(false);
    });
});

describe('assertIsNode', () => {
    test('it asserts that a given node is of the given kind', () => {
        expect(() => assertIsNode(tupleTypeNode([]), 'tupleTypeNode')).not.toThrow();
        expect(() => assertIsNode(publicKeyTypeNode(), 'tupleTypeNode')).toThrowError(
            'Expected node of kind [tupleTypeNode], got [publicKeyTypeNode].',
        );
        expect(() => assertIsNode(null, 'tupleTypeNode')).toThrowError(
            'Expected node of kind [tupleTypeNode], got [null].',
        );
    });

    test('it asserts that a given node is part of the given kinds', () => {
        expect(() => assertIsNode(tupleTypeNode([]), ['tupleTypeNode', 'publicKeyTypeNode'])).not.toThrow();
        expect(() => assertIsNode(publicKeyTypeNode(), ['tupleTypeNode', 'publicKeyTypeNode'])).not.toThrow();
        expect(() => assertIsNode(numberTypeNode('u8'), ['tupleTypeNode', 'publicKeyTypeNode'])).toThrowError(
            'Expected node of kind [tupleTypeNode,publicKeyTypeNode], got [numberTypeNode].',
        );
        expect(() => assertIsNode(null, ['tupleTypeNode', 'publicKeyTypeNode'])).toThrowError(
            'Expected node of kind [tupleTypeNode,publicKeyTypeNode], got [null].',
        );
    });
});

describe('isNodeFilter', () => {
    test('it returns a callback that checks the node is of the given kind', () => {
        const filter = isNodeFilter('tupleTypeNode');
        expect(filter(tupleTypeNode([]))).toBe(true);
        expect(filter(publicKeyTypeNode())).toBe(false);
        expect(filter(null)).toBe(false);
    });

    test('it returns a callback that checks the node is part of the given kinds', () => {
        const filter = isNodeFilter(['tupleTypeNode', 'publicKeyTypeNode']);
        expect(filter(tupleTypeNode([]))).toBe(true);
        expect(filter(publicKeyTypeNode())).toBe(true);
        expect(filter(numberTypeNode('u8'))).toBe(false);
        expect(filter(null)).toBe(false);
    });
});

describe('assertIsNodeFilter', () => {
    test('it returns a callback that asserts the node is of the given kind', () => {
        const filter = assertIsNodeFilter('tupleTypeNode');
        expect(() => filter(tupleTypeNode([]))).not.toThrow();
        expect(() => filter(publicKeyTypeNode())).toThrowError(
            'Expected node of kind [tupleTypeNode], got [publicKeyTypeNode].',
        );
        expect(() => filter(null)).toThrowError('Expected node of kind [tupleTypeNode], got [null].');
    });

    test('it returns a callback that asserts the node is part of the given kinds', () => {
        const filter = assertIsNodeFilter(['tupleTypeNode', 'publicKeyTypeNode']);
        expect(() => filter(tupleTypeNode([]))).not.toThrow();
        expect(() => filter(publicKeyTypeNode())).not.toThrow();
        expect(() => filter(numberTypeNode('u8'))).toThrowError(
            'Expected node of kind [tupleTypeNode,publicKeyTypeNode], got [numberTypeNode].',
        );
        expect(() => filter(null)).toThrowError('Expected node of kind [tupleTypeNode,publicKeyTypeNode], got [null].');
    });
});

describe('removeNullAndAssertIsNodeFilter', () => {
    test('it returns a callback that filters out null values and asserts the node is of the given kind', () => {
        const filter = removeNullAndAssertIsNodeFilter('tupleTypeNode');
        expect([tupleTypeNode([]), null].filter(filter)).toEqual([tupleTypeNode([])]);
        expect(() => [tupleTypeNode([]), publicKeyTypeNode(), null].filter(filter)).toThrowError(
            'Expected node of kind [tupleTypeNode], got [publicKeyTypeNode].',
        );
    });

    test('it returns a callback that filters out null values and asserts the node is part of the given kinds', () => {
        const filter = removeNullAndAssertIsNodeFilter(['tupleTypeNode', 'publicKeyTypeNode']);
        expect([tupleTypeNode([]), publicKeyTypeNode(), null].filter(filter)).toEqual([
            tupleTypeNode([]),
            publicKeyTypeNode(),
        ]);
        expect(() => [tupleTypeNode([]), numberTypeNode('u8'), null].filter(filter)).toThrowError(
            'Expected node of kind [tupleTypeNode,publicKeyTypeNode], got [numberTypeNode].',
        );
    });
});
