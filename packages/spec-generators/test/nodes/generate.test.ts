import { getFromRenderMap } from '@codama/fragments';
import type { Spec } from '@codama/spec';
import { getSpec } from '@codama/spec';
import { defineNode } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import {
    type GenerateOptions,
    getRenderMap,
    NODE_CONFIGS,
    type NodeConstructorConfig,
    validateRenderOptions,
} from '../../src/nodes';

function options(overrides: Partial<GenerateOptions> = {}): GenerateOptions {
    return {
        outputDir: '/tmp/unused',
        targetSpecMajor: 1,
        ...overrides,
    };
}

describe('validateRenderOptions', () => {
    const spec = getSpec();

    it('accepts the active v1 spec with defaulted options', () => {
        expect(() => validateRenderOptions(spec, options())).not.toThrow();
    });

    it('throws when targetSpecMajor does not match the spec version', () => {
        expect(() => validateRenderOptions(spec, options({ targetSpecMajor: 9 }))).toThrow(
            /targetSpecMajor=9.*major 1/,
        );
    });

    it('throws on a malformed spec version', () => {
        const broken = { ...spec, version: 'not-a-version' };
        expect(() => validateRenderOptions(broken, options())).toThrow(/unable to parse spec version "not-a-version"/);
    });

    it('throws when the default NODE_CONFIGS references a node kind the spec does not declare', () => {
        // Emptying the spec triggers the cross-check on the first
        // configured node kind (`accountNode`, etc.).
        const empty: Spec = { categories: [], version: '1.0.0' };
        expect(() => validateRenderOptions(empty, options())).toThrow(/nodeConfigs references unknown node kind/);
    });

    it('throws when the default NODE_CONFIGS.attributes references an attribute the spec does not declare', () => {
        // Build a minimal spec that *does* declare every node kind
        // mentioned in NODE_CONFIGS, but with empty attribute lists.
        // The first config entry with an `attributes` override
        // (`accountNode.data`) will trip the second cross-check branch.
        const synthetic: Spec = {
            categories: [
                {
                    enumerations: [],
                    name: 'topLevel',
                    nestedUnions: [],
                    nodes: spec.categories.flatMap(c => c.nodes).map(n => ({ ...n, attributes: [] })),
                    unions: [],
                },
            ],
            version: '1.0.0',
        };
        expect(() => validateRenderOptions(synthetic, options())).toThrow(
            /nodeConfigs\.attributes for ".+" references attribute ".+" which the spec does not declare/,
        );
    });

    it('accepts the live spec — every reserved-word positional arg has a `paramName` override', () => {
        // `enumValueNode.enum` is the one positional arg that names a
        // TS reserved word in the live spec; its config declares
        // `paramName: 'enumLink'` and passes. This test guards against
        // future spec changes that surface a new reserved-word
        // positional arg without an accompanying `paramName`.
        expect(() => validateRenderOptions(spec, options())).not.toThrow();
    });

    it('uses the caller-supplied nodeConfigs override instead of the default', () => {
        // Spec declares one synthetic node; the override references a
        // *different* kind that the spec does not declare, so the
        // validator should reject it.
        const synthetic: Spec = {
            categories: [
                {
                    enumerations: [],
                    name: 'topLevel',
                    nestedUnions: [],
                    nodes: [defineNode('realNode', { attributes: [] })],
                    unions: [],
                },
            ],
            version: '1.0.0',
        };
        const customNodeConfigs = new Map<string, NodeConstructorConfig>([['ghostNode', {}]]);
        expect(() => validateRenderOptions(synthetic, options({ nodeConfigs: customNodeConfigs }))).toThrow(
            /nodeConfigs references unknown node kind "ghostNode"/,
        );
    });

    it('accepts an empty nodeConfigs override', () => {
        // Override completely opts out of the default NODE_CONFIGS
        // table. The shared render-option checks still pass against
        // the live spec.
        expect(() => validateRenderOptions(spec, options({ nodeConfigs: new Map() }))).not.toThrow();
    });

    it('exposes NODE_CONFIGS so callers can pass it explicitly', () => {
        expect(() => validateRenderOptions(spec, options({ nodeConfigs: NODE_CONFIGS }))).not.toThrow();
    });
});

describe('getRenderMap', () => {
    const map = getRenderMap(getSpec(), { targetSpecMajor: 1 });

    it('produces a constructor file per spec node, keyed by .ts-suffixed path', () => {
        expect(map.has('AccountNode.ts')).toBe(true);
        expect(map.has('typeNodes/StructTypeNode.ts')).toBe(true);
        expect(map.has('contextualValueNodes/PdaValueNode.ts')).toBe(true);
        expect(map.has('linkNodes/PdaLinkNode.ts')).toBe(true);
    });

    it('produces a runtime kinds-array file per spec union', () => {
        expect(map.has('typeNodes/StandaloneTypeNode.ts')).toBe(true);
        expect(map.has('typeNodes/RegisteredTypeNode.ts')).toBe(true);
        expect(map.has('typeNodes/TypeNode.ts')).toBe(true);
        expect(map.has('valueNodes/ValueNode.ts')).toBe(true);
    });

    it('produces the top-level node registry file', () => {
        expect(map.has('nodeKinds.ts')).toBe(true);
    });

    it('produces per-folder index files', () => {
        expect(map.has('index.ts')).toBe(true);
        expect(map.has('typeNodes/index.ts')).toBe(true);
        expect(map.has('valueNodes/index.ts')).toBe(true);
    });

    it('keys every entry with a .ts suffix', () => {
        for (const key of map.keys()) {
            expect(key).toMatch(/\.ts$/);
        }
    });

    it('renders the constructor function in the Fragment content', () => {
        const entry = getFromRenderMap(map, 'AccountNode.ts');
        expect(entry.content).toContain('export function accountNode');
        expect(entry.content).toContain("kind: 'accountNode'");
    });

    it('emits the matching XxxNodeInput type for object-input constructors', () => {
        const entry = getFromRenderMap(map, 'AccountNode.ts');
        expect(entry.content).toContain('export type AccountNodeInput');
    });

    it('omits the XxxNodeInput type for positional-arg constructors', () => {
        const entry = getFromRenderMap(map, 'typeNodes/NumberTypeNode.ts');
        expect(entry.content).not.toContain('NumberTypeNodeInput');
        expect(entry.content).toContain('export function numberTypeNode');
    });

    it('drops empty docs at the call site via the conditional-spread pattern', () => {
        const entry = getFromRenderMap(map, 'AccountNode.ts');
        // Single `parseDocs` call hoisted to a `parsedDocs` local; the
        // conditional spread reuses the local. The local is named
        // `parsedDocs` (not `docs`) to avoid shadowing a positional
        // `docs` parameter on the few constructors that take one.
        expect(entry.content).toContain('const parsedDocs = parseDocs(input.docs);');
        expect(entry.content).toContain('...(parsedDocs.length > 0 && { docs: parsedDocs }),');
    });

    it('emits the spec-version constant as its own file, typed as `CodamaVersion`', () => {
        expect(map.has('codamaVersion.ts')).toBe(true);
        const entry = getFromRenderMap(map, 'codamaVersion.ts');
        expect(entry.content).toMatch(/export const CODAMA_VERSION: CodamaVersion = '\d+\.\d+\.\d+[^']*';/);
    });

    it('reads the spec version through CODAMA_VERSION in the rootNode constructor', () => {
        const entry = getFromRenderMap(map, 'RootNode.ts');
        // No `as CodamaVersion` cast needed — the constant carries the
        // type natively.
        expect(entry.content).toContain('version: CODAMA_VERSION,');
        expect(entry.content).toContain("import { CODAMA_VERSION } from './codamaVersion';");
    });

    it('produces a runtime kinds-array as a value (no `as const` on the array)', () => {
        // Each member is `as const`-tagged individually so the array's
        // element type is the convenient `('kindA' | 'kindB' | ...)[]`
        // shape — wider than a `readonly [...]` tuple but compatible
        // with the `isNode` helpers.
        const entry = getFromRenderMap(map, 'typeNodes/StandaloneTypeNode.ts');
        expect(entry.content).toContain('export const STANDALONE_TYPE_NODE_KINDS = [');
        expect(entry.content).not.toContain('] as const;');
        expect(entry.content).toContain("'numberTypeNode' as const,");
    });

    it('expands union-of-unions transitively by spreading the dependent kinds array', () => {
        // `TypeNode` ⊇ `StandaloneTypeNode` ∪ `definedTypeLinkNode`.
        const entry = getFromRenderMap(map, 'typeNodes/TypeNode.ts');
        expect(entry.content).toContain('...STANDALONE_TYPE_NODE_KINDS,');
        expect(entry.content).toContain("'definedTypeLinkNode' as const,");
    });

    it('aggregates every spec node-kind into REGISTERED_NODE_KINDS', () => {
        const entry = getFromRenderMap(map, 'nodeKinds.ts');
        expect(entry.content).toContain('export const REGISTERED_NODE_KINDS = [');
        // Every per-category registered-* kinds array is spread in.
        expect(entry.content).toContain('...REGISTERED_TYPE_NODE_KINDS,');
        expect(entry.content).toContain('...REGISTERED_VALUE_NODE_KINDS,');
        // Top-level node kinds appear as bare literals.
        expect(entry.content).toContain("'accountNode' as const,");
        expect(entry.content).toContain("'rootNode' as const,");
    });

    it('resolves all symbolic imports into relative paths or package specifiers', () => {
        const entry = getFromRenderMap(map, 'AccountNode.ts');
        for (const key of entry.imports.keys()) {
            // No symbolic-key prefixes left (`node:foo`, `nodeType:Bar`, etc.).
            expect(key).not.toMatch(/^[a-z]+:/);
        }
        // The interface type comes from the published package.
        expect([...entry.imports.keys()]).toContain('@codama/node-types');
    });

    it('collapses `key: key` pass-throughs to the shorthand `key`', () => {
        // `numberTypeNode` is a positional constructor whose body
        // simply forwards `format` and `endian` from the params.
        const entry = getFromRenderMap(map, 'typeNodes/NumberTypeNode.ts');
        expect(entry.content).toContain('format,');
        expect(entry.content).toContain('endian,');
        expect(entry.content).not.toContain('format: format');
        expect(entry.content).not.toContain('endian: endian');
    });

    it('widens `name` parameters from the spec brand to plain `string`', () => {
        // The spec types `name` attributes as `stringIdentifier()`,
        // which would render as `CamelCaseString`. The constructor
        // relaxes this to `string` so callers can pass any input;
        // the body wraps in `camelCase(...)` to brand the value.
        const entry = getFromRenderMap(map, 'linkNodes/AccountLinkNode.ts');
        expect(entry.content).toMatch(/name: string\b/);
        expect(entry.content).toContain('name: camelCase(name)');
    });

    it('renders spec-union references by name in generic constraints', () => {
        // `conditionalValueNode.condition` is typed as
        // `union('ConditionalValueCondition')` in the spec. The
        // generated constructor should reference that named union
        // directly rather than re-deriving its inline `A | B | C`
        // form.
        const entry = getFromRenderMap(map, 'contextualValueNodes/ConditionalValueNode.ts');
        expect(entry.content).toContain('TCondition extends ConditionalValueCondition');
    });

    it('emits a frozen render map', () => {
        expect(Object.isFrozen(map)).toBe(true);
    });
});
