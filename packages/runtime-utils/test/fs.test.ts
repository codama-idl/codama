import { CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, CodamaError } from '@codama/errors';
import { expect, test } from 'vitest';

import { createDirectory, deleteDirectory, fileExists, readJson, writeFile } from '../src';

if (__NODEJS__) {
    test('it reads JSON objects from files', () => {
        const result = readJson('./test/fs.test.json');
        expect(result).toEqual({ key: 'value' });
    });
    test('it checks if a file exists', () => {
        const result = fileExists('./test/fs.test.json');
        expect(result).toBe(true);
    });
} else {
    test('it fails to call readJson', () => {
        expect(() => readJson('./path')).toThrow(
            new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'readFileSync' }),
        );
    });
    test('it fails to call fileExists', () => {
        expect(() => fileExists('./path')).toThrow(
            new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'existsSync' }),
        );
    });
    test('it fails to call createDirectory', () => {
        expect(() => createDirectory('./path')).toThrow(
            new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'mkdirSync' }),
        );
    });
    test('it fails to call deleteDirectory', () => {
        expect(() => deleteDirectory('./path')).toThrow(
            new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'rmSync' }),
        );
    });
    test('it fails to call writeFile', () => {
        expect(() => writeFile('./path', 'content')).toThrow(
            new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'writeFileSync' }),
        );
    });
}
