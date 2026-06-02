import { describe, expect, it } from 'vitest';

import { addToImportMap } from '../../src/javascript/addToImportMap';
import { getExternalDependencies } from '../../src/javascript/getExternalDependencies';
import { createImportMap } from '../../src/javascript/ImportMap';

describe('getExternalDependencies', () => {
    it('returns the empty set for an empty map', () => {
        expect(getExternalDependencies(createImportMap()).size).toBe(0);
    });

    it('returns root names for unscoped packages', () => {
        let map = createImportMap();
        map = addToImportMap(map, 'react', ['useState']);
        map = addToImportMap(map, 'lodash/get', ['get']);
        expect(getExternalDependencies(map)).toEqual(new Set(['react', 'lodash']));
    });

    it('returns scoped root names for scoped packages', () => {
        let map = createImportMap();
        map = addToImportMap(map, '@solana/kit', ['Address']);
        map = addToImportMap(map, '@solana/kit/program-client-core', ['ProgramClient']);
        expect(getExternalDependencies(map)).toEqual(new Set(['@solana/kit']));
    });

    it('excludes relative imports', () => {
        let map = createImportMap();
        map = addToImportMap(map, '../shared', ['Local']);
        map = addToImportMap(map, './sibling', ['Sibling']);
        map = addToImportMap(map, '@codama/spec', ['Spec']);
        expect(getExternalDependencies(map)).toEqual(new Set(['@codama/spec']));
    });

    it('uses resolved module names when a dependency map is provided', () => {
        let map = createImportMap();
        map = addToImportMap(map, 'solanaAddresses', ['Address']);
        map = addToImportMap(map, 'generatedAccounts', ['MyAccount']);
        const deps = getExternalDependencies(map, {
            generatedAccounts: '../accounts',
            solanaAddresses: '@solana/kit',
        });
        expect(deps).toEqual(new Set(['@solana/kit']));
    });
});
