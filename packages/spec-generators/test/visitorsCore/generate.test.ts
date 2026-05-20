import { getFromRenderMap } from '@codama/fragments';
import { getSpec, type Spec } from '@codama/spec';
import { attribute, defineCategory, defineNode, defineUnion, union } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { type GenerateOptions, getRenderMap, validateRenderOptions } from '../../src/visitorsCore';

// Minimal spec for option-validation tests.
const spec: Spec = {
    categories: [
        defineCategory('topLevel', {
            nodes: [
                defineNode('wrappingTypeNode', {
                    attributes: [attribute('payload', union('typeNode'))],
                }),
            ],
            unions: [defineUnion('typeNode', { members: ['wrappingTypeNode'] })],
        }),
    ],
    version: '1.0.0',
};

function options(overrides: Partial<GenerateOptions> = {}): GenerateOptions {
    return {
        outputDir: '/tmp/unused',
        targetSpecMajor: 1,
        ...overrides,
    };
}

describe('validateRenderOptions', () => {
    it('accepts valid options with no overrides', () => {
        expect(() => validateRenderOptions(spec, options())).not.toThrow();
    });

    it('throws when targetSpecMajor does not match the spec version', () => {
        expect(() => validateRenderOptions(spec, options({ targetSpecMajor: 2 }))).toThrow(
            /targetSpecMajor=2.*version "1\.0\.0".*major 1/,
        );
    });

    it('throws on a malformed spec version', () => {
        const broken = { ...spec, version: 'not-a-version' };
        expect(() => validateRenderOptions(broken, options())).toThrow(/unable to parse spec version "not-a-version"/);
    });
});

describe('getRenderMap', () => {
    const map = getRenderMap(getSpec(), { targetSpecMajor: 1 });

    it('emits one page per visitor plus the test-paths map and an index', () => {
        expect(map.has('identityVisitor.ts')).toBe(true);
        expect(map.has('mergeVisitor.ts')).toBe(true);
        expect(map.has('nodeTestPaths.ts')).toBe(true);
        expect(map.has('index.ts')).toBe(true);
    });

    it('keys every entry with a .ts suffix', () => {
        for (const key of map.keys()) {
            expect(key).toMatch(/\.ts$/);
        }
    });

    it('emits the merge visitor function declaration', () => {
        const entry = getFromRenderMap(map, 'mergeVisitor.ts');
        expect(entry.content).toContain('export function mergeVisitor');
        // Body shape: one `if (keys.includes(<kind>)) { … merge(node, [...]) … }` per child-bearing node.
        expect(entry.content).toMatch(/if \(keys\.includes\('accountNode'\)\)/);
        expect(entry.content).toContain('return merge(node, [');
    });

    it('emits the identity visitor function declaration', () => {
        const entry = getFromRenderMap(map, 'identityVisitor.ts');
        expect(entry.content).toContain('export function identityVisitor');
        // Self-rebuild via the matching node constructor (e.g. `return accountNode({ ...node, … })`).
        expect(entry.content).toContain('return accountNode(');
        // Required-array attributes uniformly emit `(node.<x> ?? [])` per the
        // A.2 defensive-walk decision — every required array child is
        // tolerant of partial IDL JSON at the visitor level.
        expect(entry.content).toContain('(node.accounts ?? []).map(visit(this))');
    });

    it('emits the per-kind test-path map, keyed by kind', () => {
        const entry = getFromRenderMap(map, 'nodeTestPaths.ts');
        expect(entry.content).toContain('export const NODE_TEST_PATHS');
        expect(entry.content).toMatch(/accountNode:\s*'AccountNode'/);
        expect(entry.content).toMatch(/arrayTypeNode:\s*'typeNodes\/ArrayTypeNode'/);
    });

    it('resolves the relative helper imports for the merge visitor', () => {
        const entry = getFromRenderMap(map, 'mergeVisitor.ts');
        const importKeys = [...entry.imports.keys()];
        // `visit`/`Visitor`/`staticVisitor` resolve to the hand-written
        // sibling files above `generated/` via `helper:<name>` symbolic
        // flavours.
        expect(importKeys).toContain('../visitor');
        expect(importKeys).toContain('../staticVisitor');
        // `@codama/nodes` package specifier passes through unchanged.
        expect(importKeys).toContain('@codama/nodes');
    });

    it('emits a frozen render map', () => {
        expect(Object.isFrozen(map)).toBe(true);
    });
});
