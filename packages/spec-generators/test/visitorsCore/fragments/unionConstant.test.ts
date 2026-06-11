import type { Spec } from '@codama/spec';
import { defineCategory, defineNode, defineUnion, node, union } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { getUnionKindListFragment } from '../../../src/visitorsCore/fragments/unionConstant';
import { UNION_ALIAS_NAMES } from '../../../src/visitorsCore/options';

const spec: Spec = {
    categories: [
        defineCategory('topLevel', {
            nodes: [defineNode('aNode', { attributes: [] }), defineNode('bNode', { attributes: [] })],
            unions: [
                // Resolves to a known alias.
                defineUnion('TypeNode', { members: ['aNode'] }),
                // No alias — gets inlined as a literal.
                defineUnion('AbleNode', { members: ['aNode', 'bNode'] }),
                // Composite: one nested union with alias plus extra leaf nodes.
                defineUnion('AbleOrTypeNode', { members: [union('TypeNode'), 'bNode'] }),
            ],
        }),
    ],
    version: '1.0.0',
};

const options = { unionAliasNames: UNION_ALIAS_NAMES };

describe('getUnionKindListFragment', () => {
    it('resolves a known union name to its plural-noun alias constant', () => {
        const result = getUnionKindListFragment('TypeNode', spec, options);
        expect(result.content).toBe('TYPE_NODES');
        expect([...result.imports.keys()]).toContain('@codama/nodes');
    });

    it('inlines an unknown union as a literal kind array', () => {
        const result = getUnionKindListFragment('AbleNode', spec, options);
        expect(result.content).toBe(`['aNode', 'bNode']`);
    });

    it('mixes alias spreads and inline kinds for a composite union', () => {
        const result = getUnionKindListFragment('AbleOrTypeNode', spec, options);
        expect(result.content).toBe(`[...TYPE_NODES, 'bNode']`);
    });

    it('throws when the union name is not declared in the spec', () => {
        expect(() => getUnionKindListFragment('GhostNode', spec, options)).toThrow(
            /union "GhostNode" referenced from a child attribute is not declared in the spec/,
        );
    });

    it('throws when an inline union contains a nested union without an alias', () => {
        const composedWithoutAlias: Spec = {
            categories: [
                defineCategory('topLevel', {
                    nodes: [defineNode('aNode', { attributes: [] })],
                    unions: [
                        defineUnion('LeafNode', { members: ['aNode'] }),
                        defineUnion('OuterNode', { members: [union('LeafNode'), node('aNode')] }),
                    ],
                }),
            ],
            version: '1.0.0',
        };
        expect(() => getUnionKindListFragment('OuterNode', composedWithoutAlias, options)).toThrow(
            /OuterNode" contains a nested union "LeafNode" with no entry in unionAliasNames/,
        );
    });
});
