import { fragment, use } from '@codama/fragments/javascript';
import { describe, expect, it } from 'vitest';

import { getPageFragment, type SymbolicModule, type SymbolicModuleMap } from '../../../src/shared';

function buildModules(entries: Record<string, string>): SymbolicModuleMap {
    return new Map(Object.entries(entries) as [SymbolicModule, string][]);
}

describe('getPageFragment', () => {
    // Import-map resolution behaviour.

    it('returns the input fragment content unchanged when its imports map is empty', () => {
        const body = fragment`export type Foo = string;`;
        const result = getPageFragment(body, buildModules({}), 'Foo');
        expect(result.imports.size).toBe(0);
        expect(result.content).toBe('export type Foo = string;\n');
    });

    it('rewrites a symbolic-keyed import to a relative path against currentLocation', () => {
        // Current file lives at `typeNodes/StructTypeNode`; the referenced
        // node lives at `typeNodes/NumberTypeNode` — a sibling.
        const body = fragment`export type X = ${use('type NumberTypeNode', 'node:numberTypeNode')};`;
        const modules = buildModules({ 'node:numberTypeNode': 'typeNodes/NumberTypeNode' });
        const result = getPageFragment(body, modules, 'typeNodes/StructTypeNode');
        expect([...result.imports.keys()]).toEqual(['./NumberTypeNode']);
    });

    it('reaches across directories via the computed relative path', () => {
        const body = fragment`export type X = ${use('type Endianness', 'enumeration:Endianness')};`;
        const modules = buildModules({ 'enumeration:Endianness': 'shared/endianness' });
        const result = getPageFragment(body, modules, 'typeNodes/Foo');
        expect([...result.imports.keys()]).toEqual(['../shared/endianness']);
    });

    it('resolves hand-written sibling locations (../X) to ../../X from a subdirectory file', () => {
        // The `../X` location form denotes a hand-written sibling above
        // `generated/`. From `typeNodes/Foo`, that resolves to `../../X`.
        const body = fragment`export type X = ${use('type Docs', 'docs:Docs')};`;
        const modules = buildModules({ 'docs:Docs': '../Docs' });
        const result = getPageFragment(body, modules, 'typeNodes/Foo');
        expect([...result.imports.keys()]).toEqual(['../../Docs']);
    });

    it('resolves hand-written sibling locations to ../X from a top-level file', () => {
        const body = fragment`export type X = ${use('type Docs', 'docs:Docs')};`;
        const modules = buildModules({ 'docs:Docs': '../Docs' });
        const result = getPageFragment(body, modules, 'Foo');
        expect([...result.imports.keys()]).toEqual(['../Docs']);
    });

    it('drops a symbolic import whose target equals the current file', () => {
        // The renderer can legitimately emit a `use(...)` whose key
        // resolves to the file it is currently emitting (e.g., when a
        // node references its own kind). The resolver must omit such
        // entries — TypeScript rejects self-imports.
        const body = fragment`export type Self = ${use('type SelfNode', 'node:selfNode')};`;
        const modules = buildModules({ 'node:selfNode': 'SelfNode' });
        const result = getPageFragment(body, modules, 'SelfNode');
        expect(result.imports.size).toBe(0);
    });

    it('drops only the self-import while keeping other imports', () => {
        const body = fragment`export type X = ${use('type SelfNode', 'node:selfNode')} | ${use('type OtherNode', 'node:otherNode')};`;
        const modules = buildModules({
            'node:otherNode': 'OtherNode',
            'node:selfNode': 'SelfNode',
        });
        const result = getPageFragment(body, modules, 'SelfNode');
        expect([...result.imports.keys()]).toEqual(['./OtherNode']);
    });

    it('merges two distinct symbolic keys that resolve to the same file into one entry', () => {
        // Brands all live in the same hand-written `brands.ts` file but
        // each is keyed independently in the symbol map. After
        // resolution, both relative paths point at `../brands`, and the
        // resolver should consolidate them into a single map entry
        // carrying both identifiers.
        const body = fragment`export type X = ${use('type CamelCaseString', 'brand:CamelCaseString')} & ${use('type KebabCaseString', 'brand:KebabCaseString')};`;
        const modules = buildModules({
            'brand:CamelCaseString': '../brands',
            'brand:KebabCaseString': '../brands',
        });
        const result = getPageFragment(body, modules, 'Foo');
        expect([...result.imports.keys()]).toEqual(['../brands']);
        const brandsEntry = result.imports.get('../brands')!;
        expect([...brandsEntry.keys()].sort()).toEqual(['CamelCaseString', 'KebabCaseString']);
    });

    it('throws with the current file in the message when a symbolic key is unknown', () => {
        const body = fragment`export type X = ${use('type Unknown', 'node:doesNotExist')};`;
        expect(() => getPageFragment(body, buildModules({}), 'Foo')).toThrow(
            /unknown symbolic module "node:doesNotExist".*from "Foo"/,
        );
    });

    // Import-block stringification and trailing-whitespace normalisation.

    it('emits just the body content (no import block) when imports are empty', () => {
        const body = fragment`export type Foo = string;`;
        expect(getPageFragment(body, buildModules({}), 'Foo').content).toBe('export type Foo = string;\n');
    });

    it('trims trailing whitespace and ensures exactly one trailing newline', () => {
        const body = fragment`export type Foo = string;\n\n\n`;
        expect(getPageFragment(body, buildModules({}), 'Foo').content).toBe('export type Foo = string;\n');
    });

    it('prepends an import block for a symbolic import resolved to a relative path', () => {
        const body = fragment`export type X = ${use('type NumberTypeNode', 'node:numberTypeNode')};`;
        const modules = buildModules({ 'node:numberTypeNode': 'typeNodes/NumberTypeNode' });
        const result = getPageFragment(body, modules, 'typeNodes/StructTypeNode');
        expect(result.content).toContain(`import type { NumberTypeNode } from './NumberTypeNode';`);
        expect(result.content).toContain('export type X = NumberTypeNode;');
    });

    it('preserves the resolved imports map on the rendered fragment', () => {
        const body = fragment`export type X = ${use('type NumberTypeNode', 'node:numberTypeNode')};`;
        const modules = buildModules({ 'node:numberTypeNode': 'typeNodes/NumberTypeNode' });
        const result = getPageFragment(body, modules, 'typeNodes/StructTypeNode');
        // The imports map carries the resolved relative-path entries
        // even after the import block has been baked into `content`.
        expect([...result.imports.keys()]).toEqual(['./NumberTypeNode']);
    });
});
