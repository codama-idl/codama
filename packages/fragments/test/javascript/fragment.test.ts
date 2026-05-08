import { describe, expect, it } from 'vitest';

import { addToImportMap } from '../../src/javascript/addToImportMap';
import {
    addFragmentImports,
    fragment,
    isFragment,
    mergeFragmentImports,
    mergeFragments,
    removeFragmentImports,
    use,
} from '../../src/javascript/fragment';
import { createImportMap } from '../../src/javascript/ImportMap';

describe('fragment template tag', () => {
    it('produces a frozen fragment with no imports', () => {
        const f = fragment`hello`;
        expect(Object.isFrozen(f)).toBe(true);
        expect(f.content).toBe('hello');
        expect(f.imports.size).toBe(0);
    });
    it('joins content with no interpolations', () => {
        expect(fragment`hello`.content).toBe('hello');
    });
    it('inlines string interpolations verbatim', () => {
        expect(fragment`hello ${'world'}`.content).toBe('hello world');
    });
    it('inlines fragments and propagates their imports', () => {
        const inner = use('Foo', './foo');
        const outer = fragment`type X = ${inner};`;
        expect(outer.content).toBe('type X = Foo;');
        expect(outer.imports.get('./foo')?.has('Foo')).toBe(true);
    });
    it('elides undefined interpolations', () => {
        expect(fragment`hello ${undefined}world`.content).toBe('hello world');
    });
    it('coerces non-fragment values to strings', () => {
        expect(fragment`v=${42}`.content).toBe('v=42');
        expect(fragment`v=${true}`.content).toBe('v=true');
    });
    it('merges imports across multiple interpolated fragments', () => {
        const a = use('A', './a');
        const b = use('B', './b');
        const merged = fragment`${a} & ${b}`;
        expect(merged.content).toBe('A & B');
        expect(merged.imports.size).toBe(2);
    });
});

describe('isFragment', () => {
    it('returns true for fragments', () => {
        expect(isFragment(fragment`x`)).toBe(true);
        expect(isFragment(use('Foo', './foo'))).toBe(true);
    });
    it('returns false for non-fragments', () => {
        expect(isFragment('x')).toBe(false);
        expect(isFragment(null)).toBe(false);
        expect(isFragment(undefined)).toBe(false);
        expect(isFragment(42)).toBe(false);
        expect(isFragment({ content: 'x' })).toBe(false); // missing imports
    });
});

describe('mergeFragments', () => {
    it('combines content via the merge function', () => {
        const merged = mergeFragments([fragment`a`, fragment`b`], parts => parts.join('+'));
        expect(merged.content).toBe('a+b');
    });
    it('merges imports automatically', () => {
        const merged = mergeFragments([use('A', './a'), use('B', './b')], parts => parts.join(''));
        expect(merged.imports.size).toBe(2);
    });
    it('skips undefined fragments', () => {
        const merged = mergeFragments([fragment`a`, undefined, fragment`c`], parts => parts.join('|'));
        expect(merged.content).toBe('a|c');
    });
});

describe('use', () => {
    it('produces a fragment whose content is the used identifier', () => {
        expect(use('Foo', './foo').content).toBe('Foo');
        expect(use('Foo as Bar', './foo').content).toBe('Bar');
    });
    it('records the import on the resulting fragment', () => {
        const f = use('type Foo', './foo');
        expect(f.imports.get('./foo')?.get('Foo')?.isType).toBe(true);
    });
    it('preserves the alias on type-only imports', () => {
        const f = use('type Foo as Bar', './foo');
        expect(f.content).toBe('Bar');
        expect(f.imports.get('./foo')?.get('Bar')).toEqual({
            importedIdentifier: 'Foo',
            isType: true,
            usedIdentifier: 'Bar',
        });
    });
});

describe('addFragmentImports', () => {
    it('adds imports without changing content', () => {
        const f = addFragmentImports(fragment`hello`, './foo', ['Foo']);
        expect(f.content).toBe('hello');
        expect(f.imports.get('./foo')?.has('Foo')).toBe(true);
    });
});

describe('mergeFragmentImports', () => {
    it('merges additional import maps into a fragment', () => {
        const extra = addToImportMap(createImportMap(), './foo', ['Foo']);
        const f = mergeFragmentImports(fragment`hello`, [extra]);
        expect(f.content).toBe('hello');
        expect(f.imports.get('./foo')?.has('Foo')).toBe(true);
    });
});

describe('removeFragmentImports', () => {
    it('removes named identifiers from a fragment', () => {
        let f = addFragmentImports(fragment`hello`, './foo', ['A', 'B']);
        f = removeFragmentImports(f, './foo', ['A']);
        expect(f.imports.get('./foo')?.has('A')).toBe(false);
        expect(f.imports.get('./foo')?.has('B')).toBe(true);
    });
});
