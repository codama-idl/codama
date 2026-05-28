import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { generateTypesFromFile } from '../../src/codegen/generate-types-from-file';
import { makeRoot } from '../test-utils';

describe('generateTypesFromFile', () => {
    let workDir: string;

    beforeEach(() => {
        workDir = mkdtempSync(join(tmpdir(), 'gen-types-'));
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        rmSync(workDir, { force: true, recursive: true });
        vi.restoreAllMocks();
    });

    test('should read the IDL, run the generator, and write <basename>-<suffix>.ts', () => {
        // Given a valid IDL JSON on disk and an output directory that does not yet exist.
        const idlPath = join(workDir, 'my-idl.json');
        writeFileSync(idlPath, JSON.stringify(makeRoot([])), 'utf-8');
        const outputDirPath = join(workDir, 'out');

        // When we run the helper with a trivial generator and a custom suffix.
        generateTypesFromFile({
            codamaIdlPath: idlPath,
            generate: () => 'export const x = 1;',
            outputDirPath,
            outputFileSuffix: 'foo',
        });

        // Then the generator output is written to <output-dir>/<idl-basename>-<suffix>.ts.
        const content = readFileSync(join(outputDirPath, 'my-idl-foo.ts'), 'utf-8');
        expect(content).toBe('export const x = 1;');
    });

    test('should throw when the IDL file does not exist', () => {
        const missingPath = join(workDir, 'missing.json');

        expect(() =>
            generateTypesFromFile({
                codamaIdlPath: missingPath,
                generate: () => '',
                outputDirPath: workDir,
                outputFileSuffix: 'foo',
            }),
        ).toThrow(/IDL file not found/);
    });
});
