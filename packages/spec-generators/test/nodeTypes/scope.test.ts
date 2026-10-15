import type { Spec } from '@codama/spec';
import { defineCategory, defineEnumeration, defineNode, defineUnion, variant } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { buildRenderScope, type RenderOptions } from '../../src/nodeTypes/options';

function buildSpec(categories: Spec['categories']): Spec {
    return { categories, version: '2.0.0' };
}

const options: RenderOptions = { targetSpecMajor: 2 };

describe('buildRenderScope', () => {
    it('places type-category nodes under typeNodes/', () => {
        const scope = buildRenderScope(
            buildSpec([defineCategory('type', { nodes: [defineNode('arrayTypeNode', { attributes: [] })] })]),
            options,
        );
        expect(scope.symbolicModules.get('node:arrayTypeNode')).toBe('typeNodes/ArrayTypeNode');
    });

    it('places value-category nodes under valueNodes/', () => {
        const scope = buildRenderScope(
            buildSpec([defineCategory('value', { nodes: [defineNode('stringValueNode', { attributes: [] })] })]),
            options,
        );
        expect(scope.symbolicModules.get('node:stringValueNode')).toBe('valueNodes/StringValueNode');
    });

    it('places contextual-value nodes under contextualValueNodes/', () => {
        const scope = buildRenderScope(
            buildSpec([
                defineCategory('contextualValue', {
                    nodes: [defineNode('argumentValueNode', { attributes: [] })],
                }),
            ]),
            options,
        );
        expect(scope.symbolicModules.get('node:argumentValueNode')).toBe('contextualValueNodes/ArgumentValueNode');
    });

    it('places top-level nodes at the root', () => {
        const scope = buildRenderScope(
            buildSpec([
                defineCategory('topLevel', {
                    nodes: [defineNode('accountNode', { attributes: [] }), defineNode('rootNode', { attributes: [] })],
                }),
            ]),
            options,
        );
        expect(scope.symbolicModules.get('node:accountNode')).toBe('AccountNode');
        expect(scope.symbolicModules.get('node:rootNode')).toBe('RootNode');
    });

    it('places shared enumerations under shared/<camelCaseName>', () => {
        const scope = buildRenderScope(
            buildSpec([
                defineCategory('shared', {
                    enumerations: [
                        defineEnumeration('Endianness', { variants: [variant('be')] }),
                        defineEnumeration('NumberFormat', { variants: [variant('u32')] }),
                    ],
                }),
            ]),
            options,
        );
        expect(scope.symbolicModules.get('enumeration:Endianness')).toBe('shared/endianness');
        expect(scope.symbolicModules.get('enumeration:NumberFormat')).toBe('shared/numberFormat');
    });

    it('places category unions under their category subdirectory', () => {
        const scope = buildRenderScope(
            buildSpec([
                defineCategory('type', {
                    nodes: [defineNode('innerTypeNode', { attributes: [] })],
                    unions: [defineUnion('TypeNode', { members: ['innerTypeNode'] })],
                }),
                defineCategory('pdaSeed', {
                    nodes: [defineNode('innerSeedNode', { attributes: [] })],
                    unions: [defineUnion('ConstantPdaSeedValue', { members: ['innerSeedNode'] })],
                }),
            ]),
            options,
        );
        expect(scope.symbolicModules.get('union:TypeNode')).toBe('typeNodes/TypeNode');
        expect(scope.symbolicModules.get('union:ConstantPdaSeedValue')).toBe('pdaSeedNodes/ConstantPdaSeedValue');
    });

    it('places top-level helper unions at the root', () => {
        const scope = buildRenderScope(
            buildSpec([
                defineCategory('topLevel', {
                    nodes: [defineNode('innerNode', { attributes: [] })],
                    unions: [defineUnion('InstructionByteDeltaValue', { members: ['innerNode'] })],
                }),
            ]),
            options,
        );
        expect(scope.symbolicModules.get('union:InstructionByteDeltaValue')).toBe('InstructionByteDeltaValue');
    });

    it('points every brand at the hand-written ../brands sibling', () => {
        // None of the brand / Version files are emitted by the
        // generator; they live at the top of `@codama/node-types/src/`.
        // The scope still carries entries so renderers can resolve
        // symbolic imports against them.
        const scope = buildRenderScope(buildSpec([]), options);
        for (const brand of ['IdentifierString', 'NamespaceString', 'PathString', 'IntegerString', 'DecimalString']) {
            expect(scope.symbolicModules.get(`brand:${brand}`)).toBe('../brands');
        }
    });

    it('no longer registers casing brands', () => {
        const scope = buildRenderScope(buildSpec([]), options);
        expect(scope.symbolicModules.get('brand:CamelCaseString')).toBeUndefined();
    });

    it('no longer registers a Docs module, since docs are `string | TextNode`', () => {
        const scope = buildRenderScope(buildSpec([]), options);
        expect(scope.symbolicModules.get('docs:Docs')).toBeUndefined();
    });

    it('points version:Version at the hand-written ../Version sibling', () => {
        const scope = buildRenderScope(buildSpec([]), options);
        expect(scope.symbolicModules.get('version:Version')).toBe('../Version');
    });

    it('places version:CodamaVersion under shared/codamaVersion', () => {
        const scope = buildRenderScope(buildSpec([]), options);
        expect(scope.symbolicModules.get('version:CodamaVersion')).toBe('shared/codamaVersion');
    });

    it('points every registry:* identifier at the top-level Node file', () => {
        const scope = buildRenderScope(buildSpec([]), options);
        expect(scope.symbolicModules.get('registry:Node')).toBe('Node');
        expect(scope.symbolicModules.get('registry:NodeKind')).toBe('Node');
        expect(scope.symbolicModules.get('registry:GetNodeFromKind')).toBe('Node');
    });

    it('throws on an unknown category name', () => {
        const spec: Spec = {
            categories: [{ enumerations: [], name: 'mystery', nodes: [], unions: [] }],
            version: '2.0.0',
        };
        expect(() => buildRenderScope(spec, options)).toThrow(/unknown category "mystery"/);
    });

    it('files every entity in a category under that category folder', () => {
        // Sanity: a single category packing nodes, unions and
        // enumerations all land under the same folder.
        const scope = buildRenderScope(
            buildSpec([
                defineCategory('type', {
                    enumerations: [defineEnumeration('SomeEnum', { variants: [variant('a')] })],
                    nodes: [defineNode('a', { attributes: [] }), defineNode('b', { attributes: [] })],
                    unions: [defineUnion('SomeUnion', { members: ['a'] })],
                }),
            ]),
            options,
        );
        expect(scope.symbolicModules.get('node:a')).toBe('typeNodes/A');
        expect(scope.symbolicModules.get('union:SomeUnion')).toBe('typeNodes/SomeUnion');
        expect(scope.symbolicModules.get('enumeration:SomeEnum')).toBe('typeNodes/someEnum');
    });
});
