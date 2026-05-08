import { defineEnumeration, variant } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { getEnumerationFragment } from '../../../src/nodeTypes/fragments/enumeration';

describe('getEnumerationFragment', () => {
    it('emits a string-literal union with sorted variants', () => {
        const e = defineEnumeration('Endianness', {
            variants: [variant('le'), variant('be')],
        });
        const result = getEnumerationFragment(e);
        expect(result.content).toBe(['export type Endianness =', '| "be"', '| "le";'].join('\n'));
    });

    it('attaches the enumeration-level docs as a JSDoc block when present', () => {
        const e = defineEnumeration('E', { docs: ['My enum.'], variants: [variant('a')] });
        expect(getEnumerationFragment(e).content.startsWith('/** My enum. */\nexport type E =')).toBe(true);
    });

    it('emits a multi-paragraph JSDoc when enumeration docs span multiple paragraphs', () => {
        const e = defineEnumeration('E', {
            docs: ['First paragraph.', 'Second paragraph.'],
            variants: [variant('a')],
        });
        expect(
            getEnumerationFragment(e).content.startsWith(
                '/**\n * First paragraph.\n * Second paragraph.\n */\nexport type E =',
            ),
        ).toBe(true);
    });

    it('attaches per-variant docs in a single-line JSDoc above each variant', () => {
        const e = defineEnumeration('E', {
            variants: [variant('a', { docs: ['A.'] }), variant('b')],
        });
        const out = getEnumerationFragment(e).content;
        expect(out).toContain('/** A. */\n| "a"');
        expect(out).toContain('| "b"');
    });

    it('uses a multi-line JSDoc when a variant doc has multiple paragraphs', () => {
        const e = defineEnumeration('E', {
            variants: [variant('a', { docs: ['First line.', 'Second line.'] })],
        });
        const out = getEnumerationFragment(e).content;
        expect(out).toContain('/**\n * First line.\n * Second line.\n */');
    });

    it('produces a fragment with no imports', () => {
        const e = defineEnumeration('E', { variants: [variant('a')] });
        expect(getEnumerationFragment(e).imports.size).toBe(0);
    });

    it('escapes special characters in variant names', () => {
        const e = defineEnumeration('E', {
            variants: [variant("o'brien"), variant('back\\slash'), variant('new\nline')],
        });
        const out = getEnumerationFragment(e).content;
        // Variant strings are JSON-quoted, so apostrophes pass through
        // verbatim, backslashes and newlines are escaped.
        expect(out).toContain('| "back\\\\slash"');
        expect(out).toContain('| "new\\nline"');
        expect(out).toContain('| "o\'brien"');
    });

    it('defangs */ inside variant docs so the comment cannot terminate early', () => {
        const e = defineEnumeration('E', {
            variants: [variant('a', { docs: ['closes here */ then continues'] })],
        });
        const out = getEnumerationFragment(e).content;
        // The original `*/` must not appear; the defanged form does.
        expect(out).not.toContain('here */');
        expect(out).toContain('here *\\/ then');
    });
});
