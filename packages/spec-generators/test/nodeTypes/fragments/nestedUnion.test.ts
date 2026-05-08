import { defineNestedUnion, node, union } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { getNestedUnionFragment } from '../../../src/nodeTypes/fragments/nestedUnion';

describe('getNestedUnionFragment', () => {
    it('emits a recursive alias whose generic constraint is the base type', () => {
        const nu = defineNestedUnion('NestedTypeNode', {
            base: union('TypeNode'),
            wrappers: ['fixedSizeTypeNode'],
        });
        const out = getNestedUnionFragment(nu).content;
        expect(out).toContain('export type NestedTypeNode<TType extends TypeNode> =');
    });

    it('emits one wrapper arm per wrapper kind, each parameterised over the alias', () => {
        const nu = defineNestedUnion('NestedTypeNode', {
            base: union('TypeNode'),
            wrappers: ['fixedSizeTypeNode', 'sizePrefixTypeNode'],
        });
        const out = getNestedUnionFragment(nu).content;
        expect(out).toContain('| FixedSizeTypeNode<NestedTypeNode<TType>>');
        expect(out).toContain('| SizePrefixTypeNode<NestedTypeNode<TType>>');
    });

    it('emits the base case `| TType;` as the final arm', () => {
        const nu = defineNestedUnion('NestedTypeNode', {
            base: union('TypeNode'),
            wrappers: ['fixedSizeTypeNode'],
        });
        expect(getNestedUnionFragment(nu).content.trimEnd().endsWith('| TType;')).toBe(true);
    });

    it('sorts wrapper arms alphabetically by kind for stable output', () => {
        // Wrappers are passed in non-alphabetical order; the renderer
        // should sort them so the rendered file is deterministic.
        const nu = defineNestedUnion('NestedTypeNode', {
            base: union('TypeNode'),
            wrappers: ['sizePrefixTypeNode', 'fixedSizeTypeNode'],
        });
        const out = getNestedUnionFragment(nu).content;
        const fixedIdx = out.indexOf('| FixedSizeTypeNode<');
        const sizePrefixIdx = out.indexOf('| SizePrefixTypeNode<');
        expect(fixedIdx).toBeGreaterThan(-1);
        expect(sizePrefixIdx).toBeGreaterThan(-1);
        expect(fixedIdx).toBeLessThan(sizePrefixIdx);
    });

    it('emits a `node:<kind>` symbolic import per wrapper, plus the base type imports', () => {
        const nu = defineNestedUnion('NestedTypeNode', {
            base: union('TypeNode'),
            wrappers: ['fixedSizeTypeNode'],
        });
        const imports = [...getNestedUnionFragment(nu).imports.keys()].sort();
        expect(imports).toEqual(['node:fixedSizeTypeNode', 'union:TypeNode']);
    });

    it('renders a node-base correctly (no extra wrappers, alias still recursive)', () => {
        const nu = defineNestedUnion('NestedFoo', {
            base: node('innerNode'),
            wrappers: [],
        });
        const out = getNestedUnionFragment(nu).content;
        expect(out).toContain('export type NestedFoo<TType extends InnerNode> =');
        // No wrapper arms; the body collapses to just the base case.
        expect(out.trimEnd().endsWith('| TType;')).toBe(true);
        expect(out).not.toContain('| InnerNode<');
    });

    it('emits a JSDoc above the alias when docs are present', () => {
        const nu = defineNestedUnion('NestedTypeNode', {
            base: union('TypeNode'),
            docs: ['A recursive alias.'],
            wrappers: ['fixedSizeTypeNode'],
        });
        expect(getNestedUnionFragment(nu).content.startsWith('/** A recursive alias. */\n')).toBe(true);
    });

    it('ends the rendered content with the type alias terminator', () => {
        const nu = defineNestedUnion('NestedTypeNode', {
            base: union('TypeNode'),
            wrappers: ['fixedSizeTypeNode'],
        });
        // No trailing newline on the fragment itself; that is added by
        // `getPageFragment` when the fragment becomes a file.
        expect(getNestedUnionFragment(nu).content.endsWith(';')).toBe(true);
    });
});
