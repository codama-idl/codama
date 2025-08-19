import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

import { CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, CodamaError } from '@codama/errors';

import { Path, pathDirectory } from './path';

export const createDirectory = (path: Path): void => {
    if (!__NODEJS__) {
        throw new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'mkdirSync' });
    }

    mkdirSync(path, { recursive: true });
};

export const deleteDirectory = (path: Path): void => {
    if (!__NODEJS__) {
        throw new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'rmSync' });
    }

    if (existsSync(path)) {
        rmSync(path, { recursive: true });
    }
};

export const writeFile = (path: Path, content: string): void => {
    if (!__NODEJS__) {
        throw new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'writeFileSync' });
    }

    const directory = pathDirectory(path);
    if (!existsSync(directory)) {
        createDirectory(directory);
    }
    writeFileSync(path, content);
};

export function readFile(path: Path): string {
    if (!__NODEJS__) {
        throw new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'readFileSync' });
    }

    return readFileSync(path, 'utf-8');
}

export function readJson<T>(path: Path): T {
    return JSON.parse(readFile(path)) as T;
}
