import { describe, expect, it } from 'vitest';

import { getDocblockFragment } from '../../src/rust/getDocblockFragment';

describe('getDocblockFragment', () => {
    it('returns undefined for an empty input', () => {
        expect(getDocblockFragment([])).toBeUndefined();
    });

    it('returns undefined for an undefined input', () => {
        expect(getDocblockFragment(undefined)).toBeUndefined();
    });

    it('renders a single-line outer doc comment', () => {
        const f = getDocblockFragment(['Greets the user.']);
        expect(f?.content).toBe('/// Greets the user.');
    });

    it('renders a multi-line outer doc comment', () => {
        const f = getDocblockFragment(['First line.', 'Second line.']);
        expect(f?.content).toBe('/// First line.\n/// Second line.');
    });

    it('renders empty lines as a bare prefix line', () => {
        const f = getDocblockFragment(['First line.', '', 'Second paragraph.']);
        expect(f?.content).toBe('/// First line.\n///\n/// Second paragraph.');
    });

    it('renders inner doc comments when internal is true', () => {
        const f = getDocblockFragment(['Module docs.'], { internal: true });
        expect(f?.content).toBe('//! Module docs.');
    });

    it('renders multi-line inner doc comments', () => {
        const f = getDocblockFragment(['First line.', '', 'Second.'], { internal: true });
        expect(f?.content).toBe('//! First line.\n//!\n//! Second.');
    });

    it('appends a trailing newline when withLineJump is true', () => {
        const f = getDocblockFragment(['One.', 'Two.'], { withLineJump: true });
        expect(f?.content).toBe('/// One.\n/// Two.\n');
    });

    it('combines internal and withLineJump', () => {
        const f = getDocblockFragment(['Crate-level docs.'], { internal: true, withLineJump: true });
        expect(f?.content).toBe('//! Crate-level docs.\n');
    });

    it('returns a fragment carrying no imports', () => {
        const f = getDocblockFragment(['Hello.']);
        expect(f?.imports.size).toBe(0);
    });
});
