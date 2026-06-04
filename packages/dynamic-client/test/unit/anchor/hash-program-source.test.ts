import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import { hashProgramSource } from '../../../scripts/anchor/anchor-build-sync-module.mjs';

/**
 * Writes the file layout `hashProgramSource` expects under `root`:
 *  - `programs/example/src/<...>.rs`
 *  - `programs/example/Cargo.toml`
 *  - the anchor-root: `Cargo.toml` / `Anchor.toml` / `Cargo.lock`
 * Returns the program directory.
 */
function writeProgramFixture(root: string, srcFiles: Record<string, string>, opts: { skip?: string[] } = {}): string {
    const skip = new Set(opts.skip ?? []);
    const programDir = path.join(root, 'programs', 'example');
    mkdirSync(path.join(programDir, 'src'), { recursive: true });

    for (const [rel, content] of Object.entries(srcFiles)) {
        const full = path.join(programDir, 'src', rel);
        mkdirSync(path.dirname(full), { recursive: true });
        writeFileSync(full, content);
    }

    const defaultManifests: Record<string, string> = {
        [path.join(programDir, 'Cargo.toml')]: '[package]\nname = "example"\n',
        [path.join(root, 'Anchor.toml')]: '[toolchain]\n',
        [path.join(root, 'Cargo.lock')]: 'version = 3\n',
        [path.join(root, 'Cargo.toml')]: '[workspace]\n',
    };
    for (const [file, content] of Object.entries(defaultManifests)) {
        if (!skip.has(path.basename(file))) writeFileSync(file, content);
    }
    return programDir;
}

describe.runIf(__NODEJS__)('hashProgramSource', () => {
    const tempRoots: string[] = [];

    function makeTempRootDir(): string {
        const root = mkdtempSync(path.join(tmpdir(), 'hash-program-source-'));
        tempRoots.push(root);
        return root;
    }

    afterEach(() => {
        for (const dir of tempRoots.splice(0)) {
            rmSync(dir, { force: true, recursive: true });
        }
    });

    test('should normalize line endings: CRLF and LF content hash identically', () => {
        const crlf = hashProgramSource(
            writeProgramFixture(makeTempRootDir(), { 'lib.rs': 'line one\r\nline two\r\n' }),
        );
        const lf = hashProgramSource(writeProgramFixture(makeTempRootDir(), { 'lib.rs': 'line one\nline two\n' }));
        expect(crlf).toBe(lf);
    });

    test('should be sensitive to which file holds which content (path + content)', () => {
        const a = hashProgramSource(
            writeProgramFixture(makeTempRootDir(), { 'a.rs': 'fn x() {}', 'b.rs': 'fn y() {}' }),
        );
        const b = hashProgramSource(
            writeProgramFixture(makeTempRootDir(), { 'a.rs': 'fn y() {}', 'b.rs': 'fn x() {}' }),
        );
        expect(a).not.toBe(b);
    });

    test('should be sensitive to file renames even when the bytes are unchanged', () => {
        const a = hashProgramSource(writeProgramFixture(makeTempRootDir(), { 'lib.rs': 'fn x() {}' }));
        const b = hashProgramSource(writeProgramFixture(makeTempRootDir(), { 'main.rs': 'fn x() {}' }));
        expect(a).not.toBe(b);
    });
});
