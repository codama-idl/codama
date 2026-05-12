import type { Spec } from '@codama/spec';
import { defineCategory, defineNode, defineUnion } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { buildRenderScope, type RenderOptions } from '../../src/nodes/options';

function buildSpec(categories: Spec['categories']): Spec {
    return { categories, version: '1.0.0' };
}

const options: RenderOptions = { targetSpecMajor: 1 };

describe('buildRenderScope', () => {
    it('places top-level node constructors at the root', () => {
        const scope = buildRenderScope(
            buildSpec([defineCategory('topLevel', { nodes: [defineNode('accountNode', { attributes: [] })] })]),
            options,
        );
        expect(scope.symbolicModules.get('constructor:accountNode')).toBe('AccountNode');
    });

    it('places type-category constructors under typeNodes/', () => {
        const scope = buildRenderScope(
            buildSpec([defineCategory('type', { nodes: [defineNode('arrayTypeNode', { attributes: [] })] })]),
            options,
        );
        expect(scope.symbolicModules.get('constructor:arrayTypeNode')).toBe('typeNodes/ArrayTypeNode');
    });

    it('places contextual-value constructors under contextualValueNodes/', () => {
        const scope = buildRenderScope(
            buildSpec([
                defineCategory('contextualValue', {
                    nodes: [defineNode('argumentValueNode', { attributes: [] })],
                }),
            ]),
            options,
        );
        expect(scope.symbolicModules.get('constructor:argumentValueNode')).toBe(
            'contextualValueNodes/ArgumentValueNode',
        );
    });

    it('places category unions under their category folder', () => {
        const scope = buildRenderScope(
            buildSpec([
                defineCategory('type', {
                    nodes: [defineNode('innerTypeNode', { attributes: [] })],
                    unions: [defineUnion('TypeNode', { members: ['innerTypeNode'] })],
                }),
            ]),
            options,
        );
        expect(scope.symbolicModules.get('kinds:TypeNode')).toBe('typeNodes/TypeNode');
    });

    it('places top-level unions at the root', () => {
        const scope = buildRenderScope(
            buildSpec([
                defineCategory('topLevel', {
                    nodes: [defineNode('innerNode', { attributes: [] })],
                    unions: [defineUnion('InstructionByteDeltaValue', { members: ['innerNode'] })],
                }),
            ]),
            options,
        );
        expect(scope.symbolicModules.get('kinds:InstructionByteDeltaValue')).toBe('InstructionByteDeltaValue');
    });

    it('routes the top-level Node registry to a fixed location', () => {
        const scope = buildRenderScope(buildSpec([]), options);
        expect(scope.symbolicModules.get('kinds:Node')).toBe('nodeKinds');
    });

    it('routes generated:CodamaVersion to a fixed location', () => {
        const scope = buildRenderScope(buildSpec([]), options);
        expect(scope.symbolicModules.get('generated:CodamaVersion')).toBe('codamaVersion');
    });

    it('points shared helpers at the hand-written sibling above generated/', () => {
        const scope = buildRenderScope(buildSpec([]), options);
        expect(scope.symbolicModules.get('shared:DocsInput')).toBe('../shared');
        expect(scope.symbolicModules.get('shared:parseDocs')).toBe('../shared');
        expect(scope.symbolicModules.get('shared:camelCase')).toBe('../shared');
        expect(scope.symbolicModules.get('shared:isNode')).toBe('../Node');
    });

    it('throws on an unknown category', () => {
        const spec = {
            categories: [
                {
                    enumerations: [],
                    name: 'mystery',
                    nestedUnions: [],
                    nodes: [defineNode('someNode', { attributes: [] })],
                    unions: [],
                },
            ],
            version: '1.0.0',
        } as unknown as Spec;
        expect(() => buildRenderScope(spec, options)).toThrow(/unknown category "mystery"/);
    });
});
