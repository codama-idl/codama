import { describe, expect, it } from 'vitest';

import { getCodamaVersionFragment } from '../../../src/nodeTypes/fragments/codamaVersion';

describe('getCodamaVersionFragment', () => {
    it('emits a single-string literal type pinned to the supplied spec version', () => {
        expect(getCodamaVersionFragment('1.0.0').content).toContain(`export type CodamaVersion = '1.0.0';`);
    });

    it('embeds the version verbatim, even when it is a rc tag', () => {
        expect(getCodamaVersionFragment('1.0.0-rc.4').content).toContain(`export type CodamaVersion = '1.0.0-rc.4';`);
    });

    it('prepends a JSDoc explaining what the alias means', () => {
        const out = getCodamaVersionFragment('1.0.0').content;
        expect(out).toContain('The Codama spec version this package describes.');
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
