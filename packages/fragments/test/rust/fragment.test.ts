import { describe, expect, it } from 'vitest';

import { addToImportMap } from '../../src/rust/addToImportMap';
import {
    addFragmentImportAlias,
    addFragmentImports,
    fragment,
    isFragment,
    mergeFragmentImports,
    mergeFragments,
    removeFragmentImports,
} from '../../src/rust/fragment';
import { createImportMap } from '../../src/rust/ImportMap';

describe('fragment template tag', () => {
    it('produces a frozen fragment with an empty import map', () => {
        const f = fragment`pub struct AccountNode {}`;
        expect(Object.isFrozen(f)).toBe(true);
        expect(f.content).toBe('pub struct AccountNode {}');
        expect(f.imports.size).toBe(0);
    });
    it('inlines string interpolations verbatim', () => {
        expect(fragment`name = ${'Account'}`.content).toBe('name = Account');
    });
    it('inlines fragments and propagates their imports', () => {
        const inner = addFragmentImports(fragment`Pubkey`, ['solana_program::pubkey::Pubkey']);
        const outer = fragment`pubkey: ${inner}`;
        expect(outer.content).toBe('pubkey: Pubkey');
        expect(outer.imports.has('solana_program::pubkey::Pubkey')).toBe(true);
    });
    it('elides undefined interpolations', () => {
        expect(fragment`hello ${undefined}world`.content).toBe('hello world');
    });
    it('coerces non-fragment values to strings', () => {
        expect(fragment`v=${42}`.content).toBe('v=42');
        expect(fragment`v=${true}`.content).toBe('v=true');
    });
    it('merges imports across multiple interpolated fragments', () => {
        const a = addFragmentImports(fragment`A`, ['foo::A']);
        const b = addFragmentImports(fragment`B`, ['bar::B']);
        const merged = fragment`${a} & ${b}`;
        expect(merged.content).toBe('A & B');
        expect(merged.imports.size).toBe(2);
    });
});

describe('isFragment', () => {
    it('returns true for fragments', () => {
        expect(isFragment(fragment`x`)).toBe(true);
    });
    it('returns false for non-fragments', () => {
        expect(isFragment('x')).toBe(false);
        expect(isFragment(null)).toBe(false);
        expect(isFragment({ content: 'x' })).toBe(false);
    });
});

describe('mergeFragments', () => {
    it('combines content via the merge function', () => {
        const merged = mergeFragments([fragment`a`, fragment`b`], parts => parts.join('+'));
        expect(merged.content).toBe('a+b');
    });
    it('merges imports automatically', () => {
        const a = addFragmentImports(fragment`a`, ['foo::A']);
        const b = addFragmentImports(fragment`b`, ['bar::B']);
        const merged = mergeFragments([a, b], parts => parts.join(''));
        expect(merged.imports.size).toBe(2);
    });
    it('does not mutate input fragments imports when merging', () => {
        const a = addFragmentImports(fragment`a`, ['foo::A']);
        mergeFragments([a, addFragmentImports(fragment`b`, ['bar::B'])], parts => parts.join(''));
        expect(a.imports.size).toBe(1);
    });
    it('skips undefined fragments', () => {
        const merged = mergeFragments([fragment`a`, undefined, fragment`c`], parts => parts.join('|'));
        expect(merged.content).toBe('a|c');
    });
});

describe('addFragmentImports', () => {
    it('adds a single import without changing content', () => {
        const f = addFragmentImports(fragment`Pubkey`, 'solana_program::pubkey::Pubkey');
        expect(f.content).toBe('Pubkey');
        expect(f.imports.has('solana_program::pubkey::Pubkey')).toBe(true);
    });
    it('adds an array of imports', () => {
        const f = addFragmentImports(fragment`x`, ['foo::A', 'foo::B']);
        expect(f.imports.size).toBe(2);
    });
    it('does not mutate the source fragment', () => {
        const f = fragment`x`;
        addFragmentImports(f, ['foo::A']);
        expect(f.imports.size).toBe(0);
    });
});

describe('addFragmentImportAlias', () => {
    it('records an alias for an imported path', () => {
        const f = addFragmentImportAlias(fragment`x`, 'foo::Bar', 'Baz');
        expect(f.imports.get('foo::Bar')?.alias).toBe('Baz');
    });
    it('does not mutate the source fragment', () => {
        const f = fragment`x`;
        addFragmentImportAlias(f, 'foo::Bar', 'Baz');
        expect(f.imports.size).toBe(0);
    });
});

describe('mergeFragmentImports', () => {
    it('merges additional import maps into a fragment', () => {
        const extra = addToImportMap(createImportMap(), 'foo::Bar');
        const f = mergeFragmentImports(fragment`x`, [extra]);
        expect(f.imports.has('foo::Bar')).toBe(true);
    });
});

describe('removeFragmentImports', () => {
    it('drops paths from a fragment import map', () => {
        let f = addFragmentImports(fragment`x`, ['foo::A', 'foo::B']);
        f = removeFragmentImports(f, 'foo::A');
        expect(f.imports.has('foo::A')).toBe(false);
        expect(f.imports.has('foo::B')).toBe(true);
    });
});
