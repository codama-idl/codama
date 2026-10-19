import { describe, expect, it } from 'vitest';

import { addAliasToImportMap } from '../../src/rust/addAliasToImportMap';
import { addToImportMap } from '../../src/rust/addToImportMap';
import { getExternalDependencies } from '../../src/rust/getExternalDependencies';
import {
    createImportMap,
    getDefaultUsedIdentifier,
    type ImportMap,
    type ImportPath,
    RUST_CORE_IMPORTS,
} from '../../src/rust/ImportMap';
import { importMapToString } from '../../src/rust/importMapToString';
import { mergeImportMaps } from '../../src/rust/mergeImportMaps';
import { removeFromImportMap } from '../../src/rust/removeFromImportMap';
import { resolveImportMap } from '../../src/rust/resolveImportMap';

function getUsedIdentifiers(map: ImportMap, path: ImportPath): string[] {
    return [...(map.get(path)?.keys() ?? [])].sort();
}

describe('createImportMap', () => {
    it('returns an empty frozen map', () => {
        const map = createImportMap();
        expect(map.size).toBe(0);
        expect(Object.isFrozen(map)).toBe(true);
    });
});

describe('getDefaultUsedIdentifier', () => {
    it('returns the last segment of a path', () => {
        expect(getDefaultUsedIdentifier('solana_program::pubkey::Pubkey')).toBe('Pubkey');
    });
    it('returns the whole path when it has a single segment', () => {
        expect(getDefaultUsedIdentifier('borsh')).toBe('borsh');
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
    it('imports a path under its last segment', () => {
        const map = addToImportMap(createImportMap(), 'foo::bar::Baz');
        expect(map.get('foo::bar::Baz')?.get('Baz')).toEqual({ importedPath: 'foo::bar::Baz', usedIdentifier: 'Baz' });
    });
    it('keeps an existing alias when the same path is added plainly', () => {
        let map = addAliasToImportMap(createImportMap(), 'foo::Bar', 'Baz');
        map = addToImportMap(map, 'foo::Bar');
        expect(getUsedIdentifiers(map, 'foo::Bar')).toEqual(['Bar', 'Baz']);
    });
    it('returns a deeply frozen map', () => {
        const map = addToImportMap(createImportMap(), 'foo::Bar');
        expect(Object.isFrozen(map)).toBe(true);
        expect(Object.isFrozen(map.get('foo::Bar'))).toBe(true);
        expect(Object.isFrozen(map.get('foo::Bar')?.get('Bar'))).toBe(true);
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
        expect(map.get('foo::Bar')?.get('Baz')).toEqual({ importedPath: 'foo::Bar', usedIdentifier: 'Baz' });
        expect(getUsedIdentifiers(map, 'foo::Bar')).toEqual(['Baz']);
    });
    it('keeps an existing plain import of the same path', () => {
        let map = addToImportMap(createImportMap(), 'foo::Bar');
        map = addAliasToImportMap(map, 'foo::Bar', 'Baz');
        expect(getUsedIdentifiers(map, 'foo::Bar')).toEqual(['Bar', 'Baz']);
    });
    it('keeps an existing alias of the same path', () => {
        let map = addAliasToImportMap(createImportMap(), 'foo::Bar', 'A');
        map = addAliasToImportMap(map, 'foo::Bar', 'B');
        expect(getUsedIdentifiers(map, 'foo::Bar')).toEqual(['A', 'B']);
    });
    it('returns the input map unchanged when the alias is already recorded', () => {
        const map = addAliasToImportMap(createImportMap(), 'foo::Bar', 'Baz');
        expect(addAliasToImportMap(map, 'foo::Bar', 'Baz')).toBe(map);
    });
    it('treats an alias equal to the last path segment as the plain import', () => {
        let map = addToImportMap(createImportMap(), 'foo::Bar');
        map = addAliasToImportMap(map, 'foo::Bar', 'Bar');
        expect(getUsedIdentifiers(map, 'foo::Bar')).toEqual(['Bar']);
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
    it('drops every local name of a path', () => {
        let map = addToImportMap(createImportMap(), ['foo::A', 'foo::B']);
        map = addAliasToImportMap(map, 'foo::A', 'Alpha');
        map = removeFromImportMap(map, 'foo::A');
        expect([...map.keys()]).toEqual(['foo::B']);
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
        expect(getUsedIdentifiers(merged, 'foo::A')).toEqual(['AlphaA']);
        expect(getUsedIdentifiers(merged, 'bar::B')).toEqual(['BravoB']);
    });
    it('keeps both a plain import and an alias of the same path when the alias comes last', () => {
        const plain = addToImportMap(createImportMap(), 'crate::Mint');
        const aliased = addAliasToImportMap(createImportMap(), 'crate::Mint', 'TokenMint');
        expect(getUsedIdentifiers(mergeImportMaps([plain, aliased]), 'crate::Mint')).toEqual(['Mint', 'TokenMint']);
    });
    it('keeps both a plain import and an alias of the same path when the plain import comes last', () => {
        const plain = addToImportMap(createImportMap(), 'crate::Mint');
        const aliased = addAliasToImportMap(createImportMap(), 'crate::Mint', 'TokenMint');
        expect(getUsedIdentifiers(mergeImportMaps([aliased, plain]), 'crate::Mint')).toEqual(['Mint', 'TokenMint']);
    });
    it('keeps every alias of the same path', () => {
        const a = addAliasToImportMap(createImportMap(), 'foo::A', 'Old');
        const b = addAliasToImportMap(createImportMap(), 'foo::A', 'New');
        expect(getUsedIdentifiers(mergeImportMaps([a, b]), 'foo::A')).toEqual(['New', 'Old']);
    });
    it('deduplicates identical local names of the same path', () => {
        const a = addAliasToImportMap(addToImportMap(createImportMap(), 'foo::A'), 'foo::A', 'Alpha');
        const b = addAliasToImportMap(addToImportMap(createImportMap(), 'foo::A'), 'foo::A', 'Alpha');
        expect(getUsedIdentifiers(mergeImportMaps([a, b]), 'foo::A')).toEqual(['A', 'Alpha']);
    });
    it('does not mutate the input maps', () => {
        const a = addToImportMap(createImportMap(), 'foo::A');
        const b = addAliasToImportMap(createImportMap(), 'foo::A', 'Alpha');
        mergeImportMaps([a, b]);
        expect(getUsedIdentifiers(a, 'foo::A')).toEqual(['A']);
        expect(getUsedIdentifiers(b, 'foo::A')).toEqual(['Alpha']);
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
        expect(getUsedIdentifiers(resolved, 'crate::generated::accounts::AccountNode')).toEqual([
            'AccountNode',
            'AcctNode',
        ]);
        expect(resolved.get('crate::generated::accounts::AccountNode')?.get('AcctNode')).toEqual({
            importedPath: 'crate::generated::accounts::AccountNode',
            usedIdentifier: 'AcctNode',
        });
    });
    it('unions the local names of paths that resolve to the same path', () => {
        let map = addToImportMap(createImportMap(), 'crate::generated::Mint');
        map = addAliasToImportMap(map, 'generated::Mint', 'TokenMint');
        const resolved = resolveImportMap(map, { generated: 'crate::generated' });
        expect([...resolved.keys()]).toEqual(['crate::generated::Mint']);
        expect(getUsedIdentifiers(resolved, 'crate::generated::Mint')).toEqual(['Mint', 'TokenMint']);
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
    it('reports a crate once when one of its paths is imported under several names', () => {
        let map = addToImportMap(createImportMap(), 'borsh::BorshSerialize');
        map = addAliasToImportMap(map, 'borsh::BorshSerialize', 'Ser');
        expect(getExternalDependencies(map)).toEqual(new Set(['borsh']));
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
    it('emits one use statement per local name of the same path', () => {
        let map = addToImportMap(createImportMap(), ['crate::Account', 'crate::Mint']);
        map = addAliasToImportMap(map, 'crate::Mint', 'TokenMint');
        expect(importMapToString(map)).toBe('use crate::Account;\nuse crate::Mint as TokenMint;\nuse crate::Mint;');
    });
    it('emits the same statements regardless of the order names were added in', () => {
        let aliasFirst = addAliasToImportMap(createImportMap(), 'crate::Mint', 'TokenMint');
        aliasFirst = addAliasToImportMap(aliasFirst, 'crate::Mint', 'Mint2');
        aliasFirst = addToImportMap(aliasFirst, 'crate::Mint');
        let plainFirst = addToImportMap(createImportMap(), 'crate::Mint');
        plainFirst = addAliasToImportMap(plainFirst, 'crate::Mint', 'Mint2');
        plainFirst = addAliasToImportMap(plainFirst, 'crate::Mint', 'TokenMint');
        const expected = 'use crate::Mint as Mint2;\nuse crate::Mint as TokenMint;\nuse crate::Mint;';
        expect(importMapToString(aliasFirst)).toBe(expected);
        expect(importMapToString(plainFirst)).toBe(expected);
    });
    it('sorts the rendered statements alphabetically for stable diffs', () => {
        const map = addToImportMap(createImportMap(), ['zeta::Z', 'alpha::A', 'beta::B']);
        expect(importMapToString(map)).toBe('use alpha::A;\nuse beta::B;\nuse zeta::Z;');
    });
});
