import { R_OK, W_OK } from 'node:constants';
import fs, { PathLike } from 'node:fs';
import path from 'node:path';

export function resolveRelativePath(childPath: string, relativeDirectory: string | null = null) {
    return path.resolve(relativeDirectory ?? process.cwd(), childPath);
}

export function resolveConfigPath(childPath: string, configPath: string | null) {
    const configDir = configPath ? path.dirname(configPath) : null;
    return resolveRelativePath(childPath, configDir);
}

export function isLocalModulePath(modulePath: string) {
    return modulePath.startsWith('.') || modulePath.startsWith('/');
}

export async function writeFile(filePath: string, content: string) {
    const directory = path.dirname(filePath);
    if (!(await canWrite(directory))) {
        await fs.promises.mkdir(directory, { recursive: true });
    }
    await fs.promises.writeFile(filePath, content);
}

export async function canRead(p: PathLike) {
    try {
        await fs.promises.access(p, R_OK);
        return true;
    } catch {
        return false;
    }
}

export async function canWrite(p: PathLike) {
    try {
        await fs.promises.access(p, W_OK);
        return true;
    } catch {
        return false;
    }
}
