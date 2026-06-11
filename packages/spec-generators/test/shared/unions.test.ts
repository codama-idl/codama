import type { Spec } from '@codama/spec';
import { defineCategory, defineNode, defineUnion, node, union } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { flattenNodeUnion, getRegisteredCategoryUnions } from '../../src/shared';

describe('getRegisteredCategoryUnions', () => {
    it('returns only unions whose names start with `registered`, sorted', () => {
        const spec: Spec = {
            categories: [
                defineCategory('type', {
                    nodes: [defineNode('aNode', { attributes: [] })],
                    unions: [
                        defineUnion('typeNode', { members: ['aNode'] }),
                        defineUnion('registeredTypeNode', { members: ['aNode'] }),
                    ],
                }),
                defineCategory('value', {
                    nodes: [defineNode('bNode', { attributes: [] })],
                    unions: [defineUnion('registeredValueNode', { members: ['bNode'] })],
                }),
            ],
            version: '1.0.0',
        };
        expect(getRegisteredCategoryUnions(spec).map(u => u.name)).toEqual([
            'registeredTypeNode',
            'registeredValueNode',
        ]);
    });

    it('returns an empty list when no union has the prefix', () => {
        const spec: Spec = {
            categories: [
                defineCategory('type', {
                    nodes: [defineNode('aNode', { attributes: [] })],
                    unions: [defineUnion('typeNode', { members: ['aNode'] })],
                }),
            ],
            version: '1.0.0',
        };
        expect(getRegisteredCategoryUnions(spec)).toEqual([]);
    });

    it('returns full UnionSpec values so callers can read members', () => {
        const spec: Spec = {
            categories: [
                defineCategory('type', {
                    nodes: [defineNode('aNode', { attributes: [] })],
                    unions: [defineUnion('registeredTypeNode', { members: ['aNode'] })],
                }),
            ],
            version: '1.0.0',
        };
        const [first] = getRegisteredCategoryUnions(spec);
        expect(first.name).toBe('registeredTypeNode');
        expect(first.members).toEqual([{ kind: 'node', name: 'aNode' }]);
    });
});

describe('flattenNodeUnion', () => {
    it('returns the leaf node specs of a flat union', () => {
        const spec: Spec = {
            categories: [
                defineCategory('type', {
                    nodes: [defineNode('aNode', { attributes: [] }), defineNode('bNode', { attributes: [] })],
                    unions: [defineUnion('TypeNode', { members: ['aNode', 'bNode'] })],
                }),
            ],
            version: '1.0.0',
        };
        const [typeNode] = spec.categories[0].unions;
        expect(
            flattenNodeUnion(typeNode, spec)
                .map(n => n.kind)
                .sort(),
        ).toEqual(['aNode', 'bNode']);
    });

    it('recurses through nested `union` members', () => {
        const spec: Spec = {
            categories: [
                defineCategory('type', {
                    nodes: [defineNode('aNode', { attributes: [] }), defineNode('bNode', { attributes: [] })],
                    unions: [
                        defineUnion('Inner', { members: ['bNode'] }),
                        defineUnion('Outer', { members: [union('Inner'), node('aNode')] }),
                    ],
                }),
            ],
            version: '1.0.0',
        };
        const outer = spec.categories[0].unions.find(u => u.name === 'Outer')!;
        expect(
            flattenNodeUnion(outer, spec)
                .map(n => n.kind)
                .sort(),
        ).toEqual(['aNode', 'bNode']);
    });

    it('skips unresolved member references silently', () => {
        const spec: Spec = {
            categories: [
                defineCategory('type', {
                    nodes: [defineNode('aNode', { attributes: [] })],
                    // `union('Ghost')` points at a union not declared anywhere.
                    unions: [defineUnion('Outer', { members: [union('Ghost'), node('aNode')] })],
                }),
            ],
            version: '1.0.0',
        };
        const [outer] = spec.categories[0].unions;
        expect(flattenNodeUnion(outer, spec).map(n => n.kind)).toEqual(['aNode']);
    });

    it('breaks cycles in the union graph', () => {
        const spec: Spec = {
            categories: [
                defineCategory('type', {
                    nodes: [defineNode('aNode', { attributes: [] }), defineNode('bNode', { attributes: [] })],
                    unions: [
                        defineUnion('A', { members: [union('B'), node('aNode')] }),
                        defineUnion('B', { members: [union('A'), node('bNode')] }),
                    ],
                }),
            ],
            version: '1.0.0',
        };
        const a = spec.categories[0].unions.find(u => u.name === 'A')!;
        expect(
            flattenNodeUnion(a, spec)
                .map(n => n.kind)
                .sort(),
        ).toEqual(['aNode', 'bNode']);
    });
});
