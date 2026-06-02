import { describe, expect, it } from 'vitest';

import { getExportAllFragment } from '../../src/javascript/getExportAllFragment';

describe('getExportAllFragment', () => {
    it('renders an export-all statement for a relative module', () => {
        const f = getExportAllFragment('./accounts');
        expect(f.content).toBe(`export * from './accounts';`);
    });

    it('renders an export-all statement for a non-relative module', () => {
        const f = getExportAllFragment('@codama/spec');
        expect(f.content).toBe(`export * from '@codama/spec';`);
    });

    it('does not add anything to the import map', () => {
        const f = getExportAllFragment('./accounts');
        expect(f.imports.size).toBe(0);
    });
});
