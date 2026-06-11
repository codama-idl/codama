import type { Spec } from '@codama/spec';
import {
    defineCategory,
    defineEnumeration,
    defineNestedUnion,
    defineNode,
    defineUnion,
    node,
    variant,
} from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { buildRenderScope, type RenderOptions } from '../../src/nodeTypes/options';

function buildSpec(categories: Spec['categories']): Spec {
    return { categories, version: '1.0.0' };
}

const options: RenderOptions = { targetSpecMajor: 1 };

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

    it('places nested-union aliases under their parent category', () => {
        const scope = buildRenderScope(
            buildSpec([
                defineCategory('type', {
                    nestedUnions: [
                        defineNestedUnion('NestedTypeNode', {
                            base: node('innerTypeNode'),
                            wrappers: ['fixedSizeTypeNode'],
                        }),
                    ],
                    nodes: [
                        defineNode('innerTypeNode', { attributes: [] }),
                        defineNode('fixedSizeTypeNode', { attributes: [] }),
                    ],
                }),
            ]),
            options,
        );
        expect(scope.symbolicModules.get('nestedUnion:NestedTypeNode')).toBe('typeNodes/NestedTypeNode');
    });

    it('points every brand at the hand-written ../brands sibling', () => {
        // None of the brand / Docs / Version files are emitted by the
        // generator; they live at the top of `@codama/node-types/src/`.
        // The scope still carries entries so renderers can resolve
        // symbolic imports against them.
        const scope = buildRenderScope(buildSpec([]), options);
        expect(scope.symbolicModules.get('brand:CamelCaseString')).toBe('../brands');
        expect(scope.symbolicModules.get('brand:KebabCaseString')).toBe('../brands');
        expect(scope.symbolicModules.get('brand:PascalCaseString')).toBe('../brands');
        expect(scope.symbolicModules.get('brand:SnakeCaseString')).toBe('../brands');
        expect(scope.symbolicModules.get('brand:TitleCaseString')).toBe('../brands');
    });

    it('points docs:Docs at the hand-written ../Docs sibling', () => {
        const scope = buildRenderScope(buildSpec([]), options);
        expect(scope.symbolicModules.get('docs:Docs')).toBe('../Docs');
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
            categories: [{ enumerations: [], name: 'mystery', nestedUnions: [], nodes: [], unions: [] }],
            version: '1.0.0',
        };
        expect(() => buildRenderScope(spec, options)).toThrow(/unknown category "mystery"/);
    });

    it('files every entity in a category under that category folder', () => {
        // Sanity: a single category packing nodes, unions, enumerations,
        // and nested unions all land under the same folder.
        const scope = buildRenderScope(
            buildSpec([
                defineCategory('type', {
                    enumerations: [defineEnumeration('SomeEnum', { variants: [variant('a')] })],
                    nestedUnions: [
                        defineNestedUnion('SomeNested', {
                            base: node('a'),
                            wrappers: ['b'],
                        }),
                    ],
                    nodes: [defineNode('a', { attributes: [] }), defineNode('b', { attributes: [] })],
                    unions: [defineUnion('SomeUnion', { members: ['a'] })],
                }),
            ]),
            options,
        );
        expect(scope.symbolicModules.get('node:a')).toBe('typeNodes/A');
        expect(scope.symbolicModules.get('union:SomeUnion')).toBe('typeNodes/SomeUnion');
        expect(scope.symbolicModules.get('enumeration:SomeEnum')).toBe('typeNodes/someEnum');
        expect(scope.symbolicModules.get('nestedUnion:SomeNested')).toBe('typeNodes/SomeNested');
    });
});
