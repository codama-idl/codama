import type { ImportMap, ImportPath } from './ImportMap';

/**
 * Rewrite the symbolic prefixes of an import map's paths against a
 * dependency map.
 *
 * Resolution is by prefix match on the `::` separator: an import
 * `'generated::accounts::AccountNode'` against
 * `{ generated: 'crate::generated' }` becomes
 * `'crate::generated::accounts::AccountNode'`. Paths that don't match any
 * prefix are kept unchanged. Aliases follow their path.
 *
 * Renderers typically pre-define a base set of symbolic modules
 * (`generated → crate::generated`, `mplToolbox → mpl_toolbox`, etc.) and
 * pass them through this function just before calling
 * {@link importMapToString} or {@link getExternalDependencies}.
 *
 * @param importMap - The import map to resolve.
 * @param dependencies - A record mapping symbolic prefixes to resolved
 * Rust paths.
 * @return A new frozen import map with all paths resolved.
 *
 * @example
 * ```ts
 * import { addToImportMap, createImportMap, resolveImportMap } from '@codama/fragments/rust';
 *
 * const map = addToImportMap(createImportMap(), 'generated::accounts::AccountNode');
 * const resolved = resolveImportMap(map, { generated: 'crate::generated' });
 * // resolved has 'crate::generated::accounts::AccountNode'
 * ```
 */
export function resolveImportMap(importMap: ImportMap, dependencies: Record<string, string>): ImportMap {
    const prefixes = Object.keys(dependencies);
    if (prefixes.length === 0 || importMap.size === 0) return importMap;
    const next = new Map(importMap);
    let mutated = false;
    for (const [path, info] of importMap) {
        const resolvedPath = resolvePath(path, dependencies, prefixes);
        if (resolvedPath === path) continue;
        next.delete(path);
        next.set(resolvedPath, Object.freeze({ ...info, importedPath: resolvedPath }));
        mutated = true;
    }
    return mutated ? Object.freeze(next) : importMap;
}

function resolvePath(path: ImportPath, dependencies: Record<string, string>, prefixes: readonly string[]): ImportPath {
    for (const prefix of prefixes) {
        if (path.startsWith(`${prefix}::`)) {
            return dependencies[prefix] + path.slice(prefix.length);
        }
    }
    return path;
}
