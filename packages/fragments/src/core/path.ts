/**
 * Path manipulation helpers used by code generators to assemble output
 * file paths.
 *
 * The {@link Path} type is a thin documentation alias for `string` —
 * any place a generator stores or threads a filesystem-relative path,
 * use this name to communicate intent. The {@link joinPath} and
 * {@link pathDirectory} helpers delegate to `node:path` on Node and
 * fall back to lightweight string manipulation on non-Node platforms.
 */

import { basename, dirname, join, posix } from 'node:path';

import { CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, CodamaError } from '@codama/errors';

/** A filesystem path inside the generator's output tree. */
export type Path = string;

/**
 * Join two or more path segments together. Uses `node:path`'s
 * platform-aware {@link join} on Node; on other platforms (browser,
 * react-native) falls back to a `/`-joined form with consecutive
 * slashes collapsed.
 */
export function joinPath(...paths: Path[]): string {
    if (!__NODEJS__) {
        return paths.join('/').replace(/\/+/g, '/');
    }

    return join(...paths);
}

/**
 * Return the directory portion of a path (i.e. everything up to the
 * last `/` segment). Uses `node:path`'s {@link dirname} on Node and a
 * plain `lastIndexOf` fallback on other platforms.
 */
export function pathDirectory(path: Path): Path {
    if (!__NODEJS__) {
        return path.substring(0, path.lastIndexOf('/'));
    }

    return dirname(path);
}

/**
 * Return the trailing segment of a path (everything after the last
 * `/`). Uses `node:path`'s {@link basename} on Node and a plain
 * `lastIndexOf` fallback on other platforms.
 */
export function pathBasename(path: Path): Path {
    if (!__NODEJS__) {
        const slash = path.lastIndexOf('/');
        return slash >= 0 ? path.substring(slash + 1) : path;
    }

    return basename(path);
}

/**
 * Compute the POSIX-style relative path from `from` to `to`. Both
 * arguments are treated as `/`-separated logical paths regardless of
 * platform, so the result is consistent across operating systems —
 * suitable for emitting into source code as an import specifier.
 *
 * Node only: non-Node platforms throw {@link CodamaError} because
 * implementing a correct POSIX relative-path algorithm without
 * `node:path` is non-trivial and no current consumer needs it.
 */
export function relativePath(from: Path, to: Path): string {
    if (!__NODEJS__) {
        throw new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'relative' });
    }

    return posix.relative(from, to);
}
