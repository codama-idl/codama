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
                defineUnion('typeNode', { members: ['aNode'] }),
                // No alias — gets inlined as a literal.
                defineUnion('ableNode', { members: ['aNode', 'bNode'] }),
                // Composite: one nested union with alias plus extra leaf nodes.
                defineUnion('ableOrTypeNode', { members: [union('typeNode'), 'bNode'] }),
            ],
        }),
    ],
    version: '1.0.0',
};

const options = { unionAliasNames: UNION_ALIAS_NAMES };

describe('getUnionKindListFragment', () => {
    it('resolves a known union name to its plural-noun alias constant', () => {
        const result = getUnionKindListFragment('typeNode', spec, options);
        expect(result.content).toBe('TYPE_NODES');
        expect([...result.imports.keys()]).toContain('@codama/nodes');
    });

    it('inlines an unknown union as a literal kind array', () => {
        const result = getUnionKindListFragment('ableNode', spec, options);
        expect(result.content).toBe(`['aNode', 'bNode']`);
    });

    it('mixes alias spreads and inline kinds for a composite union', () => {
        const result = getUnionKindListFragment('ableOrTypeNode', spec, options);
        expect(result.content).toBe(`[...TYPE_NODES, 'bNode']`);
    });

    it('throws when the union name is not declared in the spec', () => {
        expect(() => getUnionKindListFragment('ghostNode', spec, options)).toThrow(
            /union "ghostNode" referenced from a child attribute is not declared in the spec/,
        );
    });

    it('throws when an inline union contains a nested union without an alias', () => {
        const composedWithoutAlias: Spec = {
            categories: [
                defineCategory('topLevel', {
                    nodes: [defineNode('aNode', { attributes: [] })],
                    unions: [
                        defineUnion('leafNode', { members: ['aNode'] }),
                        defineUnion('outerNode', { members: [union('leafNode'), node('aNode')] }),
                    ],
                }),
            ],
            version: '1.0.0',
        };
        expect(() => getUnionKindListFragment('outerNode', composedWithoutAlias, options)).toThrow(
            /outerNode" contains a nested union "leafNode" with no entry in unionAliasNames/,
        );
    });
});
