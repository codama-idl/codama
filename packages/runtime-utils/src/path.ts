import { dirname, join } from 'node:path';

export type Path = string;

export function joinPath(...paths: Path[]): string {
    if (!__NODEJS__) {
        return paths.join('/').replace(/\/+/g, '/');
    }

    return join(...paths);
}

export function pathDirectory(path: Path): Path {
    if (!__NODEJS__) {
        return path.substring(0, path.lastIndexOf('/'));
    }

    return dirname(path);
}
