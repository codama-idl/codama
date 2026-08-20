import { describe, expect, test } from 'vitest';

import { getCodamaVersionMajor } from '../../src';

describe('getCodamaVersionMajor', () => {
    test('extracts the major from stable versions', () => {
        expect(getCodamaVersionMajor('1.9.1')).toBe(1);
        expect(getCodamaVersionMajor('2.0.0')).toBe(2);
        expect(getCodamaVersionMajor('10.42.7')).toBe(10);
        expect(getCodamaVersionMajor('0.21.3')).toBe(0);
    });

    test('extracts the major from pre-release versions', () => {
        expect(getCodamaVersionMajor('2.0.0-rc.4')).toBe(2);
        expect(getCodamaVersionMajor('1.6.0-rc.6')).toBe(1);
    });

    test('returns null when no major can be parsed', () => {
        expect(getCodamaVersionMajor('')).toBeNull();
        expect(getCodamaVersionMajor('not-a-version')).toBeNull();
        expect(getCodamaVersionMajor('v1.0.0')).toBeNull();
        expect(getCodamaVersionMajor('1')).toBeNull();
        expect(getCodamaVersionMajor('.1.0')).toBeNull();
    });
});
