import { describe, expect, it } from 'vitest';

import { addToImportMap } from '../../src/javascript/addToImportMap';
import { createImportMap, parseImportInput } from '../../src/javascript/ImportMap';
import { mergeImportMaps } from '../../src/javascript/mergeImportMaps';
import { removeFromImportMap } from '../../src/javascript/removeFromImportMap';

describe('parseImportInput', () => {
    it('parses a plain identifier', () => {
        expect(parseImportInput('Foo')).toEqual({
            importedIdentifier: 'Foo',
            isType: false,
            usedIdentifier: 'Foo',
        });
    });
    it('parses a type-only import', () => {
        expect(parseImportInput('type Foo')).toEqual({
            importedIdentifier: 'Foo',
            isType: true,
            usedIdentifier: 'Foo',
        });
    });
    it('parses an aliased import', () => {
        expect(parseImportInput('Foo as Bar')).toEqual({
            importedIdentifier: 'Foo',
            isType: false,
            usedIdentifier: 'Bar',
        });
    });
    it('parses a type-only aliased import', () => {
        expect(parseImportInput('type Foo as Bar')).toEqual({
            importedIdentifier: 'Foo',
            isType: true,
            usedIdentifier: 'Bar',
        });
    });
});

describe('createImportMap', () => {
    it('returns an empty frozen map', () => {
        const map = createImportMap();
        expect(map.size).toBe(0);
        expect(Object.isFrozen(map)).toBe(true);
    });
});

describe('addToImportMap', () => {
    it('adds imports to an empty map', () => {
        const map = addToImportMap(createImportMap(), './foo', ['Foo', 'Bar']);
        expect(map.size).toBe(1);
        expect(map.get('./foo')?.size).toBe(2);
    });
    it('returns the same map when called with no imports', () => {
        const empty = createImportMap();
        expect(addToImportMap(empty, './foo', [])).toBe(empty);
    });
    it('merges into an existing module', () => {
        let map = addToImportMap(createImportMap(), './foo', ['A']);
        map = addToImportMap(map, './foo', ['B']);
        expect(map.get('./foo')?.size).toBe(2);
    });
    it('promotes a value import over a type-only import within the same batch', () => {
        // Type-only first, value second.
        const a = addToImportMap(createImportMap(), './foo', ['type Foo', 'Foo']);
        expect(a.get('./foo')?.get('Foo')?.isType).toBe(false);
        // Value first, type-only second — should not be downgraded.
        const b = addToImportMap(createImportMap(), './foo', ['Foo', 'type Foo']);
        expect(b.get('./foo')?.get('Foo')?.isType).toBe(false);
    });
});

describe('removeFromImportMap', () => {
    it('removes named identifiers', () => {
        const map = addToImportMap(createImportMap(), './foo', ['A', 'B']);
        const after = removeFromImportMap(map, './foo', ['A']);
        expect(after.get('./foo')?.size).toBe(1);
        expect(after.get('./foo')?.has('A')).toBe(false);
    });
    it('drops the module entirely when no identifiers remain', () => {
        const map = addToImportMap(createImportMap(), './foo', ['A']);
        const after = removeFromImportMap(map, './foo', ['A']);
        expect(after.has('./foo')).toBe(false);
    });
    it('silently ignores names that are not present', () => {
        const map = addToImportMap(createImportMap(), './foo', ['A']);
        const after = removeFromImportMap(map, './foo', ['NotThere']);
        expect(after.get('./foo')?.size).toBe(1);
    });
});

describe('mergeImportMaps', () => {
    it('returns the empty map for an empty input', () => {
        expect(mergeImportMaps([]).size).toBe(0);
    });
    it('returns the single map when given one input', () => {
        const map = addToImportMap(createImportMap(), './foo', ['A']);
        expect(mergeImportMaps([map])).toBe(map);
    });
    it('merges across modules', () => {
        const a = addToImportMap(createImportMap(), './foo', ['A']);
        const b = addToImportMap(createImportMap(), './bar', ['B']);
        const merged = mergeImportMaps([a, b]);
        expect(merged.size).toBe(2);
    });
    it('promotes a value import over a type-only import of the same name', () => {
        const a = addToImportMap(createImportMap(), './foo', ['type Foo']);
        const b = addToImportMap(createImportMap(), './foo', ['Foo']);
        const merged = mergeImportMaps([a, b]);
        expect(merged.get('./foo')?.get('Foo')?.isType).toBe(false);
    });
    it('does not downgrade a value import to type-only when the type-only entry comes second', () => {
        const a = addToImportMap(createImportMap(), './foo', ['Foo']);
        const b = addToImportMap(createImportMap(), './foo', ['type Foo']);
        const merged = mergeImportMaps([a, b]);
        expect(merged.get('./foo')?.get('Foo')?.isType).toBe(false);
    });
});
