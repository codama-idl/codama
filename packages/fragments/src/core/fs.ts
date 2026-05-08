/**
 * Node-only filesystem helpers used by code generators to write their
 * output to disk. Each function checks the `__NODEJS__` build flag and
 * throws a structured {@link CodamaError} on non-Node platforms so
 * accidental calls from a browser bundle fail loudly rather than
 * silently no-oping.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

import { CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, CodamaError } from '@codama/errors';

import { Path, pathDirectory } from './path';

/** Create a directory (and any missing parents) at the given path. */
export function createDirectory(path: Path): void {
    if (!__NODEJS__) {
        throw new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'mkdirSync' });
    }

    mkdirSync(path, { recursive: true });
}

/** Recursively delete the directory at the given path, if it exists. */
export function deleteDirectory(path: Path): void {
    if (!__NODEJS__) {
        throw new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'rmSync' });
    }

    if (existsSync(path)) {
        rmSync(path, { recursive: true });
    }
}

/**
 * Write `content` to a file at `path`, creating intermediate
 * directories as needed.
 */
export function writeFile(path: Path, content: string): void {
    if (!__NODEJS__) {
        throw new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'writeFileSync' });
    }

    const directory = pathDirectory(path);
    if (!existsSync(directory)) {
        createDirectory(directory);
    }
    writeFileSync(path, content);
}

/** Check whether a file or directory exists at the given path. */
export function fileExists(path: Path): boolean {
    if (!__NODEJS__) {
        throw new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'existsSync' });
    }

    return existsSync(path);
}

/** Read the file at the given path as a UTF-8 string. */
export function readFile(path: Path): string {
    if (!__NODEJS__) {
        throw new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'readFileSync' });
    }

    return readFileSync(path, 'utf-8');
}

/**
 * Read the file at the given path as a UTF-8 string and parse it as
 * JSON. The result is typed as the caller-supplied `T`; no runtime
 * validation is performed.
 */
export function readJson<T>(path: Path): T {
    return JSON.parse(readFile(path)) as T;
}
