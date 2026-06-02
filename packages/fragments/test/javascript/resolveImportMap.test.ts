import { describe, expect, it } from 'vitest';

import { addToImportMap } from '../../src/javascript/addToImportMap';
import { createImportMap } from '../../src/javascript/ImportMap';
import { resolveImportMap } from '../../src/javascript/resolveImportMap';

describe('resolveImportMap', () => {
    it('rewrites the module key when the dependency map has a matching entry', () => {
        let map = createImportMap();
        map = addToImportMap(map, 'solanaAddresses', ['Address']);
        const resolved = resolveImportMap(map, { solanaAddresses: '@solana/kit' });
        expect(resolved.has('@solana/kit')).toBe(true);
        expect(resolved.has('solanaAddresses')).toBe(false);
    });

    it('preserves the inner identifier map of a resolved module', () => {
        let map = createImportMap();
        map = addToImportMap(map, 'solanaAddresses', ['type Address', 'getAddressFromPublicKey']);
        const resolved = resolveImportMap(map, { solanaAddresses: '@solana/kit' });
        const inner = resolved.get('@solana/kit');
        expect(inner?.size).toBe(2);
        expect(inner?.get('Address')?.isType).toBe(true);
    });

    it('leaves unmapped modules unchanged', () => {
        let map = createImportMap();
        map = addToImportMap(map, '@codama/spec', ['Spec']);
        map = addToImportMap(map, '../shared', ['Local']);
        const resolved = resolveImportMap(map, { solanaAddresses: '@solana/kit' });
        expect(resolved.has('@codama/spec')).toBe(true);
        expect(resolved.has('../shared')).toBe(true);
    });

    it('merges inner maps when two source modules resolve to the same target', () => {
        let map = createImportMap();
        map = addToImportMap(map, 'solanaAddresses', ['Address']);
        map = addToImportMap(map, 'solanaCodecsCore', ['Codec']);
        const resolved = resolveImportMap(map, {
            solanaAddresses: '@solana/kit',
            solanaCodecsCore: '@solana/kit',
        });
        const inner = resolved.get('@solana/kit');
        expect(inner?.size).toBe(2);
        expect(inner?.has('Address')).toBe(true);
        expect(inner?.has('Codec')).toBe(true);
    });

    it('returns the input map unchanged when the dependency map is empty', () => {
        const map = addToImportMap(createImportMap(), './foo', ['Foo']);
        // The function may return the input directly when there's nothing to do.
        expect(resolveImportMap(map, {})).toEqual(map);
    });

    it('returns the input map unchanged when the input is empty', () => {
        const map = createImportMap();
        expect(resolveImportMap(map, { solanaAddresses: '@solana/kit' })).toBe(map);
    });
});
