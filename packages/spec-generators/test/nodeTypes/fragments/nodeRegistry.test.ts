import type { Spec } from '@codama/spec';
import { defineCategory, defineNode, defineUnion } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { getNodeRegistryFragment } from '../../../src/nodeTypes/fragments/nodeRegistry';

// The renderer derives the registered-union list from any `registered*`
// union in the spec. This helper plumbs a minimum but complete spec:
// one stub node per registered category, each registered union
// referencing that node, plus extra top-level nodes the caller can
// supply.
function buildSpecWithAllRegisteredUnions(extraTopLevelNodes: readonly string[] = []): Spec {
    const stubKinds = [
        'someContextualValueNode',
        'someCountNode',
        'someDiscriminatorNode',
        'someLinkNode',
        'somePdaSeedNode',
        'someTypeNode',
        'someValueNode',
    ];
    return {
        categories: [
            defineCategory('topLevel', {
                nodes: [...stubKinds, ...extraTopLevelNodes].map(k => defineNode(k, { attributes: [] })),
                unions: [
                    defineUnion('registeredContextualValueNode', { members: ['someContextualValueNode'] }),
                    defineUnion('registeredCountNode', { members: ['someCountNode'] }),
                    defineUnion('registeredDiscriminatorNode', { members: ['someDiscriminatorNode'] }),
                    defineUnion('registeredLinkNode', { members: ['someLinkNode'] }),
                    defineUnion('registeredPdaSeedNode', { members: ['somePdaSeedNode'] }),
                    defineUnion('registeredTypeNode', { members: ['someTypeNode'] }),
                    defineUnion('registeredValueNode', { members: ['someValueNode'] }),
                ],
            }),
        ],
        version: '1.0.0',
    };
}

describe('getNodeRegistryFragment', () => {
    it('emits the Node Registration and Node Helpers section headers', () => {
        const out = getNodeRegistryFragment(buildSpecWithAllRegisteredUnions()).content;
        expect(out).toContain('// Node Registration.');
        expect(out).toContain('// Node Helpers.');
    });

    it("emits the NodeKind discriminant alias as Node['kind']", () => {
        const out = getNodeRegistryFragment(buildSpecWithAllRegisteredUnions()).content;
        expect(out).toContain("export type NodeKind = Node['kind'];");
    });

    it('emits the GetNodeFromKind helper as an Extract<…> over the kind discriminant', () => {
        const out = getNodeRegistryFragment(buildSpecWithAllRegisteredUnions()).content;
        expect(out).toContain('export type GetNodeFromKind<TKind extends NodeKind> = Extract<Node, { kind: TKind }>;');
    });

    it('lists every registeredXxxNode union as a Node member', () => {
        const result = getNodeRegistryFragment(buildSpecWithAllRegisteredUnions());
        const imports = [...result.imports.keys()].sort();
        expect(imports).toContain('union:registeredContextualValueNode');
        expect(imports).toContain('union:registeredCountNode');
        expect(imports).toContain('union:registeredDiscriminatorNode');
        expect(imports).toContain('union:registeredLinkNode');
        expect(imports).toContain('union:registeredPdaSeedNode');
        expect(imports).toContain('union:registeredTypeNode');
        expect(imports).toContain('union:registeredValueNode');
    });

    it('lists non-registered nodes as direct Node members', () => {
        // `accountNode` and `rootNode` aren't inside any registeredXxxNode
        // union, so they should appear as direct members of `Node`.
        const result = getNodeRegistryFragment(buildSpecWithAllRegisteredUnions(['accountNode', 'rootNode']));
        const imports = [...result.imports.keys()];
        expect(imports).toContain('node:accountNode');
        expect(imports).toContain('node:rootNode');
    });

    it('omits nodes that are reachable through a registeredXxxNode union from direct membership', () => {
        // `someTypeNode` is covered by `registeredTypeNode`; it must not
        // appear as a direct member of `Node`.
        const result = getNodeRegistryFragment(buildSpecWithAllRegisteredUnions());
        const imports = [...result.imports.keys()];
        expect(imports).not.toContain('node:someTypeNode');
    });

    it('walks nested unions and excludes any node reachable through them from direct membership', () => {
        // Nest a sub-union inside `registeredTypeNode`. The sub-union's
        // members must still be considered "covered" and excluded from
        // direct `Node` membership.
        const spec: Spec = {
            categories: [
                defineCategory('topLevel', {
                    nodes: [
                        defineNode('someContextualValueNode', { attributes: [] }),
                        defineNode('someCountNode', { attributes: [] }),
                        defineNode('someDiscriminatorNode', { attributes: [] }),
                        defineNode('someLinkNode', { attributes: [] }),
                        defineNode('somePdaSeedNode', { attributes: [] }),
                        defineNode('someValueNode', { attributes: [] }),
                        defineNode('deeplyNestedTypeNode', { attributes: [] }),
                    ],
                    unions: [
                        defineUnion('registeredContextualValueNode', { members: ['someContextualValueNode'] }),
                        defineUnion('registeredCountNode', { members: ['someCountNode'] }),
                        defineUnion('registeredDiscriminatorNode', { members: ['someDiscriminatorNode'] }),
                        defineUnion('registeredLinkNode', { members: ['someLinkNode'] }),
                        defineUnion('registeredPdaSeedNode', { members: ['somePdaSeedNode'] }),
                        defineUnion('registeredValueNode', { members: ['someValueNode'] }),
                        defineUnion('innerTypeNode', { members: ['deeplyNestedTypeNode'] }),
                        defineUnion('registeredTypeNode', {
                            members: [{ kind: 'union', name: 'innerTypeNode' }],
                        }),
                    ],
                }),
            ],
            version: '1.0.0',
        };
        const result = getNodeRegistryFragment(spec);
        const imports = [...result.imports.keys()];
        // The deeply-nested node is reachable through Inner → Registered…,
        // so it must not appear as a direct Node member.
        expect(imports).not.toContain('node:deeplyNestedTypeNode');
    });

    it('only emits the registeredXxxNode unions present in the spec', () => {
        // The registry is derived from `spec` — unions whose names start
        // with `registered`. If the spec ships only some of them, the
        // renderer emits exactly those and quietly omits the rest.
        const spec: Spec = {
            categories: [
                defineCategory('topLevel', {
                    nodes: [defineNode('someContextualValueNode', { attributes: [] })],
                    unions: [defineUnion('registeredContextualValueNode', { members: ['someContextualValueNode'] })],
                }),
            ],
            version: '1.0.0',
        };
        const result = getNodeRegistryFragment(spec);
        const imports = [...result.imports.keys()];
        expect(imports).toContain('union:registeredContextualValueNode');
        expect(imports).not.toContain('union:registeredCountNode');
    });

    it('sorts the Node members alphabetically for stable output', () => {
        const out = getNodeRegistryFragment(buildSpecWithAllRegisteredUnions(['zzNode', 'aaNode'])).content;
        const aaIdx = out.indexOf('| AaNode');
        const zzIdx = out.indexOf('| ZzNode');
        const regContextualIdx = out.indexOf('| RegisteredContextualValueNode');
        expect(aaIdx).toBeGreaterThan(-1);
        expect(zzIdx).toBeGreaterThan(-1);
        expect(regContextualIdx).toBeGreaterThan(-1);
        expect(aaIdx).toBeLessThan(regContextualIdx);
        expect(regContextualIdx).toBeLessThan(zzIdx);
    });
});
