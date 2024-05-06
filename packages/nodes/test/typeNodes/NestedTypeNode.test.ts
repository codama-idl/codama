import { describe, expect, test } from 'vitest';

import {
    assertIsNestedTypeNode,
    fixedSizeTypeNode,
    isNestedTypeNode,
    numberTypeNode,
    publicKeyTypeNode,
    resolveNestedTypeNode,
    sizePrefixTypeNode,
    stringTypeNode,
    transformNestedTypeNode,
} from '../../src';

describe('resolveNestedTypeNode', () => {
    test('it resolved nested type nodes', () => {
        const node = sizePrefixTypeNode(fixedSizeTypeNode(stringTypeNode('utf8'), 32), numberTypeNode('u8'));
        expect(resolveNestedTypeNode(node)).toEqual(stringTypeNode('utf8'));
    });

    test('it returns the same instance when resolving nested types nodes', () => {
        const node = numberTypeNode('u8');
        expect(resolveNestedTypeNode(node)).toBe(node);
    });
});

describe('transformNestedTypeNode', () => {
    test('it transforms nested type nodes', () => {
        const node = sizePrefixTypeNode(fixedSizeTypeNode(stringTypeNode('utf8'), 32), numberTypeNode('u8'));
        const transformedNode = transformNestedTypeNode(node, () => publicKeyTypeNode());
        expect(transformedNode).toEqual(
            sizePrefixTypeNode(fixedSizeTypeNode(publicKeyTypeNode(), 32), numberTypeNode('u8')),
        );
    });
});

describe('isNestedTypeNode', () => {
    test('it checks if a node is a nested type', () => {
        const flatNode = numberTypeNode('u64');
        expect(isNestedTypeNode(flatNode, 'numberTypeNode')).toBe(true);
        expect(isNestedTypeNode(flatNode, 'stringTypeNode')).toBe(false);

        const nestedNode = sizePrefixTypeNode(fixedSizeTypeNode(numberTypeNode('u64'), 32), numberTypeNode('u8'));
        expect(isNestedTypeNode(nestedNode, 'numberTypeNode')).toBe(true);
        expect(isNestedTypeNode(nestedNode, 'stringTypeNode')).toBe(false);
    });
});

describe('assertIsNestedTypeNode', () => {
    test('it asserts that a node is a nested type', () => {
        const flatNode = numberTypeNode('u64');
        expect(() => assertIsNestedTypeNode(flatNode, 'numberTypeNode')).not.toThrow();
        expect(() => assertIsNestedTypeNode(flatNode, 'stringTypeNode')).toThrow();

        const nestedNode = sizePrefixTypeNode(fixedSizeTypeNode(numberTypeNode('u64'), 32), numberTypeNode('u8'));
        expect(() => assertIsNestedTypeNode(nestedNode, 'numberTypeNode')).not.toThrow();
        expect(() => assertIsNestedTypeNode(nestedNode, 'stringTypeNode')).toThrow();
    });
});
