import { describe, expect, it } from 'vitest';

import { getDocblockFragment } from '../../src/javascript/getDocblockFragment';

describe('getDocblockFragment', () => {
    it('returns undefined for an empty input', () => {
        expect(getDocblockFragment([])).toBeUndefined();
    });

    it('returns undefined for an undefined input', () => {
        expect(getDocblockFragment(undefined)).toBeUndefined();
    });

    it('renders a single-line docblock', () => {
        const f = getDocblockFragment(['Greets the user.']);
        expect(f?.content).toBe('/** Greets the user. */');
    });

    it('renders a multi-line docblock with star-prefixed lines', () => {
        const f = getDocblockFragment(['First line.', 'Second line.']);
        expect(f?.content).toBe('/**\n * First line.\n * Second line.\n */');
    });

    it('renders empty lines as bare ` *` separators', () => {
        const f = getDocblockFragment(['First line.', '', 'Second paragraph.']);
        expect(f?.content).toBe('/**\n * First line.\n *\n * Second paragraph.\n */');
    });

    it('appends a trailing newline when withLineJump is true', () => {
        const single = getDocblockFragment(['One line.'], { withLineJump: true });
        expect(single?.content).toBe('/** One line. */\n');
        const multi = getDocblockFragment(['A.', 'B.'], { withLineJump: true });
        expect(multi?.content).toBe('/**\n * A.\n * B.\n */\n');
    });

    it('defangs `*/` sequences in input lines so they cannot close the docblock early', () => {
        const f = getDocblockFragment(['Naive */ injection attempt.']);
        expect(f?.content).toBe('/** Naive *\\/ injection attempt. */');
    });

    it('defangs `*/` in multi-line docblocks too', () => {
        const f = getDocblockFragment(['Line one.', 'Line */ two.', 'Line three.']);
        expect(f?.content).toBe('/**\n * Line one.\n * Line *\\/ two.\n * Line three.\n */');
    });

    it('returns a fragment carrying no imports', () => {
        const f = getDocblockFragment(['Hello.']);
        expect(f?.imports.size).toBe(0);
    });
});
