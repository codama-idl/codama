import type { ImportMap, ImportPath } from './ImportMap';

/**
 * Drop one or more imported paths from an import map. Paths that aren't
 * present are silently ignored. The input map is not mutated.
 *
 * @param importMap - The import map to trim.
 * @param paths - The Rust paths to remove. May be a single string, an
 * array, or a {@link Set}.
 * @return A new frozen import map without those entries.
 *
 * @example
 * ```ts
 * import { addToImportMap, createImportMap, removeFromImportMap } from '@codama/fragments/rust';
 *
 * let map = addToImportMap(createImportMap(), ['foo::A', 'foo::B']);
 * map = removeFromImportMap(map, 'foo::A');
 * ```
 */
export function removeFromImportMap(
    importMap: ImportMap,
    paths: ImportPath | ReadonlySet<string> | readonly ImportPath[],
): ImportMap {
    const targets = typeof paths === 'string' ? [paths] : [...paths];
    if (targets.length === 0) return importMap;
    const next = new Map(importMap);
    for (const path of targets) next.delete(path);
    return Object.freeze(next);
}
