import { describe, expect, it } from 'vitest';

import { addAliasToImportMap } from '../../src/rust/addAliasToImportMap';
import { addToImportMap } from '../../src/rust/addToImportMap';
import { getExternalDependencies } from '../../src/rust/getExternalDependencies';
import { createImportMap, RUST_CORE_IMPORTS } from '../../src/rust/ImportMap';
import { importMapToString } from '../../src/rust/importMapToString';
import { mergeImportMaps } from '../../src/rust/mergeImportMaps';
import { removeFromImportMap } from '../../src/rust/removeFromImportMap';
import { resolveImportMap } from '../../src/rust/resolveImportMap';

describe('createImportMap', () => {
    it('returns an empty frozen map', () => {
        const map = createImportMap();
        expect(map.size).toBe(0);
        expect(Object.isFrozen(map)).toBe(true);
    });
});

describe('addToImportMap', () => {
    it('accepts a single string', () => {
        const map = addToImportMap(createImportMap(), 'foo::Bar');
        expect(map.has('foo::Bar')).toBe(true);
        expect(map.size).toBe(1);
    });
    it('accepts an array', () => {
        const map = addToImportMap(createImportMap(), ['foo::A', 'foo::B']);
        expect(map.size).toBe(2);
    });
    it('accepts a Set', () => {
        const map = addToImportMap(createImportMap(), new Set(['foo::A', 'foo::B']));
        expect(map.size).toBe(2);
    });
    it('returns the input map unchanged when called with no paths', () => {
        const empty = createImportMap();
        expect(addToImportMap(empty, [])).toBe(empty);
    });
    it('returns the input map unchanged when every path is already present', () => {
        const map = addToImportMap(createImportMap(), ['foo::A']);
        expect(addToImportMap(map, 'foo::A')).toBe(map);
    });
    it('preserves an existing alias when the same path is re-added', () => {
        let map = addAliasToImportMap(createImportMap(), 'foo::Bar', 'Baz');
        map = addToImportMap(map, 'foo::Bar');
        expect(map.get('foo::Bar')?.alias).toBe('Baz');
    });
    it('does not mutate the input map', () => {
        const map = createImportMap();
        addToImportMap(map, 'foo::Bar');
        expect(map.size).toBe(0);
    });
});

describe('addAliasToImportMap', () => {
    it('records an alias for a previously unimported path', () => {
        const map = addAliasToImportMap(createImportMap(), 'foo::Bar', 'Baz');
        expect(map.get('foo::Bar')?.alias).toBe('Baz');
        expect(map.get('foo::Bar')?.importedPath).toBe('foo::Bar');
    });
    it('replaces an existing alias for the same path', () => {
        let map = addAliasToImportMap(createImportMap(), 'foo::Bar', 'A');
        map = addAliasToImportMap(map, 'foo::Bar', 'B');
        expect(map.get('foo::Bar')?.alias).toBe('B');
    });
    it('does not mutate the input map', () => {
        const map = createImportMap();
        addAliasToImportMap(map, 'foo::Bar', 'Baz');
        expect(map.size).toBe(0);
    });
});

describe('removeFromImportMap', () => {
    it('drops a single path', () => {
        let map = addToImportMap(createImportMap(), ['foo::A', 'foo::B']);
        map = removeFromImportMap(map, 'foo::A');
        expect(map.has('foo::A')).toBe(false);
        expect(map.has('foo::B')).toBe(true);
    });
    it('drops an array of paths', () => {
        let map = addToImportMap(createImportMap(), ['foo::A', 'foo::B', 'foo::C']);
        map = removeFromImportMap(map, ['foo::A', 'foo::B']);
        expect(map.size).toBe(1);
    });
    it('silently ignores missing paths', () => {
        const map = addToImportMap(createImportMap(), 'foo::A');
        const after = removeFromImportMap(map, 'foo::NotThere');
        expect(after.size).toBe(1);
    });
    it('returns the input map unchanged when called with no paths', () => {
        const map = addToImportMap(createImportMap(), 'foo::A');
        expect(removeFromImportMap(map, [])).toBe(map);
    });
});

describe('mergeImportMaps', () => {
    it('returns the empty map for an empty input', () => {
        expect(mergeImportMaps([]).size).toBe(0);
    });
    it('returns the single map when given one input', () => {
        const map = addToImportMap(createImportMap(), 'foo::A');
        expect(mergeImportMaps([map])).toBe(map);
    });
    it('combines paths from multiple maps', () => {
        const a = addToImportMap(createImportMap(), 'foo::A');
        const b = addToImportMap(createImportMap(), 'bar::B');
        expect(mergeImportMaps([a, b]).size).toBe(2);
    });
    it('combines aliases from multiple maps', () => {
        const a = addAliasToImportMap(createImportMap(), 'foo::A', 'AlphaA');
        const b = addAliasToImportMap(createImportMap(), 'bar::B', 'BravoB');
        const merged = mergeImportMaps([a, b]);
        expect(merged.get('foo::A')?.alias).toBe('AlphaA');
        expect(merged.get('bar::B')?.alias).toBe('BravoB');
    });
    it('lets the latest map win on alias conflicts for the same path', () => {
        const a = addAliasToImportMap(createImportMap(), 'foo::A', 'Old');
        const b = addAliasToImportMap(createImportMap(), 'foo::A', 'New');
        expect(mergeImportMaps([a, b]).get('foo::A')?.alias).toBe('New');
    });
});

describe('resolveImportMap', () => {
    it('rewrites the leading prefix when a matching dependency is provided', () => {
        const map = addToImportMap(createImportMap(), 'generated::accounts::AccountNode');
        const resolved = resolveImportMap(map, { generated: 'crate::generated' });
        expect(resolved.has('crate::generated::accounts::AccountNode')).toBe(true);
        expect(resolved.has('generated::accounts::AccountNode')).toBe(false);
    });
    it('preserves aliases under prefix resolution', () => {
        let map = addToImportMap(createImportMap(), 'generated::accounts::AccountNode');
        map = addAliasToImportMap(map, 'generated::accounts::AccountNode', 'AcctNode');
        const resolved = resolveImportMap(map, { generated: 'crate::generated' });
        expect(resolved.get('crate::generated::accounts::AccountNode')?.alias).toBe('AcctNode');
    });
    it('leaves unmatched paths unchanged', () => {
        const map = addToImportMap(createImportMap(), 'foo::Bar');
        const resolved = resolveImportMap(map, { generated: 'crate::generated' });
        expect(resolved.has('foo::Bar')).toBe(true);
    });
    it('returns the input map unchanged when nothing matches', () => {
        const map = addToImportMap(createImportMap(), 'foo::Bar');
        expect(resolveImportMap(map, { generated: 'crate::generated' })).toBe(map);
    });
    it('returns the input map unchanged when dependencies is empty', () => {
        const map = addToImportMap(createImportMap(), 'foo::Bar');
        expect(resolveImportMap(map, {})).toBe(map);
    });
    it('does not mutate the input map', () => {
        const map = addToImportMap(createImportMap(), 'generated::Bar');
        resolveImportMap(map, { generated: 'crate::generated' });
        expect(map.has('generated::Bar')).toBe(true);
    });
});

describe('getExternalDependencies', () => {
    it('returns top-level crate names', () => {
        const map = addToImportMap(createImportMap(), [
            'borsh::BorshDeserialize',
            'solana_program::pubkey::Pubkey',
            'std::collections::HashMap',
        ]);
        expect(getExternalDependencies(map)).toEqual(new Set(['borsh', 'solana_program']));
    });
    it('excludes Rust core crates', () => {
        let map = createImportMap();
        for (const core of RUST_CORE_IMPORTS) map = addToImportMap(map, `${core}::Foo`);
        expect(getExternalDependencies(map).size).toBe(0);
    });
    it('uses resolved paths so symbolic prefixes are excluded too', () => {
        const map = addToImportMap(createImportMap(), ['generated::accounts::A', 'borsh::BorshSerialize']);
        const deps = getExternalDependencies(map, { generated: 'crate::generated' });
        expect(deps).toEqual(new Set(['borsh']));
    });
});

describe('importMapToString', () => {
    it('emits one use statement per import', () => {
        const map = addToImportMap(createImportMap(), ['borsh::BorshDeserialize', 'borsh::BorshSerialize']);
        expect(importMapToString(map)).toBe('use borsh::BorshDeserialize;\nuse borsh::BorshSerialize;');
    });
    it('emits use foo::Bar as Baz; for aliased imports', () => {
        const map = addAliasToImportMap(createImportMap(), 'solana_program::program_error::ProgramError', 'ProgError');
        expect(importMapToString(map)).toBe('use solana_program::program_error::ProgramError as ProgError;');
    });
    it('applies dependency-map resolution before rendering', () => {
        const map = addToImportMap(createImportMap(), 'generated::accounts::A');
        expect(importMapToString(map, { generated: 'crate::generated' })).toBe('use crate::generated::accounts::A;');
    });
    it('renders the empty string for an empty map', () => {
        expect(importMapToString(createImportMap())).toBe('');
    });
    it('sorts the rendered statements alphabetically for stable diffs', () => {
        const map = addToImportMap(createImportMap(), ['zeta::Z', 'alpha::A', 'beta::B']);
        expect(importMapToString(map)).toBe('use alpha::A;\nuse beta::B;\nuse zeta::Z;');
    });
});
