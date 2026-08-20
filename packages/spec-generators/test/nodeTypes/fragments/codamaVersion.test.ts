import { describe, expect, it } from 'vitest';

import { getCodamaVersionFragment } from '../../../src/nodeTypes/fragments/codamaVersion';

describe('getCodamaVersionFragment', () => {
    it('emits a major-pinned template-literal type derived from the supplied spec version', () => {
        expect(getCodamaVersionFragment('1.9.1').content).toContain(
            'export type CodamaVersion = `1.${number}.${number}`;',
        );
    });

    it('pins the major only, ignoring the minor and patch of the supplied version', () => {
        expect(getCodamaVersionFragment('2.3.4').content).toContain(
            'export type CodamaVersion = `2.${number}.${number}`;',
        );
    });

    it('derives the major from pre-release spec versions too', () => {
        expect(getCodamaVersionFragment('2.0.0-rc.4').content).toContain(
            'export type CodamaVersion = `2.${number}.${number}`;',
        );
    });

    it('throws when the spec version has no parsable major', () => {
        expect(() => getCodamaVersionFragment('next')).toThrow('Cannot parse a major version');
    });

    it('prepends a JSDoc explaining what the alias means', () => {
        const out = getCodamaVersionFragment('1.0.0').content;
        expect(out).toContain('The shape of Codama spec versions this package describes.');
        // Multi-paragraph docs use the block-form `/** … */` with each
        // paragraph on its own ` * ` line.
        expect(out.startsWith('/**\n')).toBe(true);
        expect(out).toMatch(/\*\/\nexport type CodamaVersion =/);
    });

    it('produces a fragment with no imports', () => {
        expect(getCodamaVersionFragment('1.0.0').imports.size).toBe(0);
    });

    it('ends the rendered content with the type alias terminator', () => {
        // The fragment itself does not carry a trailing newline; that is
        // added by `getPageFragment` when the fragment becomes a file.
        expect(getCodamaVersionFragment('1.0.0').content.endsWith(';')).toBe(true);
    });
});
