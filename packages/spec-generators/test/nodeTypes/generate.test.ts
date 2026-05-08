import { getFromRenderMap } from '@codama/fragments';
import { getSpec, type Spec } from '@codama/spec';
import {
    attribute,
    defineCategory,
    defineEnumeration,
    defineNode,
    defineUnion,
    enumeration,
    union,
    variant,
} from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { type GenerateOptions, getRenderMap, validateRenderOptions } from '../../src/nodeTypes';

// Minimum spec exercising both `narrowableDataAttributes` and
// `genericParamOrder` validation: one node with one data attribute
// (`endian`) and one child attribute (`payload`).
const spec: Spec = {
    categories: [
        defineCategory('topLevel', {
            enumerations: [defineEnumeration('Endianness', { variants: [variant('be'), variant('le')] })],
            nodes: [
                defineNode('wrappingTypeNode', {
                    attributes: [
                        attribute('payload', union('TypeNode')),
                        attribute('endian', enumeration('Endianness')),
                    ],
                }),
            ],
            unions: [defineUnion('TypeNode', { members: ['wrappingTypeNode'] })],
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

    it('accepts a narrowableDataAttributes set whose keys all resolve in the spec', () => {
        expect(() =>
            validateRenderOptions(spec, options({ narrowableDataAttributes: new Set(['wrappingTypeNode:endian']) })),
        ).not.toThrow();
    });

    it('accepts a genericParamOrder map whose keys and attributes all resolve', () => {
        expect(() =>
            validateRenderOptions(spec, options({ genericParamOrder: new Map([['wrappingTypeNode', ['payload']]]) })),
        ).not.toThrow();
    });

    it('throws when targetSpecMajor does not match the spec version', () => {
        expect(() => validateRenderOptions(spec, options({ targetSpecMajor: 2 }))).toThrow(
            /targetSpecMajor=2.*version "1\.0\.0".*major 1/,
        );
    });

    it('throws on a narrowableDataAttributes key that does not resolve in the spec', () => {
        expect(() =>
            validateRenderOptions(spec, options({ narrowableDataAttributes: new Set(['ghostTypeNode:format']) })),
        ).toThrow(/narrowableDataAttributes references "ghostTypeNode:format"/);
    });

    it('throws on a genericParamOrder key that names an unknown node kind', () => {
        expect(() =>
            validateRenderOptions(spec, options({ genericParamOrder: new Map([['ghostTypeNode', ['x']]]) })),
        ).toThrow(/genericParamOrder references unknown node kind "ghostTypeNode"/);
    });

    it('throws when genericParamOrder references an attribute the node does not declare', () => {
        expect(() =>
            validateRenderOptions(spec, options({ genericParamOrder: new Map([['wrappingTypeNode', ['ghost']]]) })),
        ).toThrow(/genericParamOrder for "wrappingTypeNode" references attribute "ghost"/);
    });

    it('throws on a malformed spec version', () => {
        const broken = { ...spec, version: 'not-a-version' };
        expect(() => validateRenderOptions(broken, options())).toThrow(/unable to parse spec version "not-a-version"/);
    });

    it('accepts a categoryDirectories map covering every spec category', () => {
        expect(() =>
            validateRenderOptions(spec, options({ categoryDirectories: new Map([['topLevel', 'roots']]) })),
        ).not.toThrow();
    });

    it('throws when categoryDirectories is supplied but misses a spec category', () => {
        // The spec only has the `topLevel` category; an empty override
        // omits it and so should fail.
        expect(() => validateRenderOptions(spec, options({ categoryDirectories: new Map() }))).toThrow(
            /categoryDirectories is missing an entry for spec category "topLevel"/,
        );
    });
});

describe('getRenderMap', () => {
    const map = getRenderMap(getSpec(), { targetSpecMajor: 1 });

    it('produces an entry per generated file, keyed by .ts-suffixed path', () => {
        expect(map.has('AccountNode.ts')).toBe(true);
        expect(map.has('typeNodes/StructTypeNode.ts')).toBe(true);
        expect(map.has('shared/codamaVersion.ts')).toBe(true);
        expect(map.has('Node.ts')).toBe(true);
    });

    it('keys every entry with a .ts suffix', () => {
        for (const key of map.keys()) {
            expect(key).toMatch(/\.ts$/);
        }
    });

    it('preserves the Fragment imports map keyed by resolved relative paths', () => {
        // `AccountNode` references the hand-written `Docs` and brands
        // siblings, plus a few subdir nodes. After resolution every key
        // is a relative path (no symbolic `node:` / `docs:` keys left).
        const entry = getFromRenderMap(map, 'AccountNode.ts');
        for (const key of entry.imports.keys()) {
            expect(key).not.toMatch(/^[a-z]+:/);
        }
        expect([...entry.imports.keys()]).toContain('../Docs');
        expect([...entry.imports.keys()]).toContain('../brands');
        expect([...entry.imports.keys()]).toContain('./typeNodes/NestedTypeNode');
    });

    it('emits the rendered interface body as the Fragment content', () => {
        const entry = getFromRenderMap(map, 'AccountNode.ts');
        expect(entry.content).toContain('export interface AccountNode');
    });

    it('bakes the resolved import block into the Fragment content', () => {
        // `getRenderMap` now applies `renderPage` per entry, so the
        // import statements appear in the rendered content alongside
        // the interface body. The `imports` map carries the same
        // information as metadata.
        const entry = getFromRenderMap(map, 'AccountNode.ts');
        expect(entry.content).toContain(`import type { Docs } from '../Docs';`);
        expect(entry.content).toContain(`import type { CamelCaseString } from '../brands';`);
    });

    it('emits a frozen render map', () => {
        expect(Object.isFrozen(map)).toBe(true);
    });
});
