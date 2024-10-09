import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

import { CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, KinobiError } from '@codama/errors';

export function readJson<T extends object>(value: string): T {
    if (!__NODEJS__) {
        throw new KinobiError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'readFileSync' });
    }

    return JSON.parse(readFileSync(value, 'utf-8')) as T;
}

export const createDirectory = (path: string): void => {
    if (!__NODEJS__) {
        throw new KinobiError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'mkdirSync' });
    }

    mkdirSync(path, { recursive: true });
};

export const deleteDirectory = (path: string): void => {
    if (!__NODEJS__) {
        throw new KinobiError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'rmSync' });
    }

    if (existsSync(path)) {
        rmSync(path, { recursive: true });
    }
};

export const createFile = (path: string, content: string): void => {
    if (!__NODEJS__) {
        throw new KinobiError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'writeFileSync' });
    }

    const directory = path.substring(0, path.lastIndexOf('/'));
    if (!existsSync(directory)) {
        createDirectory(directory);
    }
    writeFileSync(path, content);
};
