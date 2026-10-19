import type { Spec } from '@codama/spec';
import { defineCategory, defineNode, defineUnion, node, union } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { getUnionKindListFragment } from '../../../src/visitorsCore/fragments/unionConstant';
import { KINDS_CONSTANT_UNIONS } from '../../../src/visitorsCore/options';

const spec: Spec = {
    categories: [
        defineCategory('topLevel', {
            nodes: [defineNode('aNode', { attributes: [] }), defineNode('bNode', { attributes: [] })],
            unions: [
                // Resolves to its kinds constant.
                defineUnion('typeNode', { members: ['aNode'] }),
                // Not listed: gets inlined as a literal.
                defineUnion('ableNode', { members: ['aNode', 'bNode'] }),
                // Composite: one listed nested union plus extra leaf nodes.
                defineUnion('ableOrTypeNode', { members: [union('typeNode'), 'bNode'] }),
            ],
        }),
    ],
    version: '1.0.0',
};

const options = { kindsConstantUnions: KINDS_CONSTANT_UNIONS };

describe('getUnionKindListFragment', () => {
    it('resolves a listed union name to its kinds constant', () => {
        const result = getUnionKindListFragment('typeNode', spec, options);
        expect(result.content).toBe('TYPE_NODE_KINDS');
        expect([...result.imports.keys()]).toContain('@codama/nodes');
    });

    it('inlines an unknown union as a literal kind array', () => {
        const result = getUnionKindListFragment('ableNode', spec, options);
        expect(result.content).toBe(`['aNode', 'bNode']`);
    });

    it('mixes kinds constant spreads and inline kinds for a composite union', () => {
        const result = getUnionKindListFragment('ableOrTypeNode', spec, options);
        expect(result.content).toBe(`[...TYPE_NODE_KINDS, 'bNode']`);
    });

    it('throws when the union name is not declared in the spec', () => {
        expect(() => getUnionKindListFragment('ghostNode', spec, options)).toThrow(
            /union "ghostNode" referenced from a child attribute is not declared in the spec/,
        );
    });

    it('throws when an inline union contains an unlisted nested union', () => {
        const composedWithUnlistedUnion: Spec = {
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
        expect(() => getUnionKindListFragment('outerNode', composedWithUnlistedUnion, options)).toThrow(
            /outerNode" contains a nested union "leafNode" with no entry in kindsConstantUnions/,
        );
    });
});
