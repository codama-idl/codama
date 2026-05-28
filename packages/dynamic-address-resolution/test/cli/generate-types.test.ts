import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterAll, describe, expect, test } from 'vitest';

import { makeRoot } from '../test-utils';

const CLI_PATH = path.resolve('bin/cli.cjs');

function execCli(args: string[]) {
    try {
        const stdout = execFileSync('node', [CLI_PATH, ...args], {
            cwd: path.resolve('.'),
            encoding: 'utf-8',
            stdio: 'pipe',
        });
        return { exitCode: 0, stderr: '', stdout };
    } catch (error: unknown) {
        const e = error as { status: number; stderr: string; stdout: string };
        return { exitCode: e.status ?? 1, stderr: e.stderr ?? '', stdout: e.stdout ?? '' };
    }
}

describe('CLI', () => {
    const tmpDirs: string[] = [];

    afterAll(() => {
        for (const dir of tmpDirs) {
            rmSync(dir, { force: true, recursive: true });
        }
    });

    test('should print help when no arguments are provided', () => {
        const { stdout, exitCode } = execCli([]);
        expect(stdout).toContain('Usage: dynamic-address-resolution');
        expect(stdout).toContain('generate-types <codama-idl> <output-dir>');
        expect(exitCode).toBe(0);
    });

    test('should read IDL and write output file for generate-types', () => {
        const tmpDir = mkdtempSync(path.join(tmpdir(), 'dar-cli-'));
        tmpDirs.push(tmpDir);
        const idlPath = path.join(tmpDir, 'test.json');
        writeFileSync(idlPath, JSON.stringify(makeRoot([])), 'utf-8');

        const { exitCode } = execCli(['generate-types', idlPath, tmpDir]);
        expect(exitCode).toBe(0);

        const outputPath = path.join(tmpDir, 'test-address-resolution-types.ts');
        expect(existsSync(outputPath)).toBe(true);
    });
});
