import type { Alias, ImportMap, ImportPath } from './ImportMap';

/**
 * Record an alias (`use foo::Bar as Baz;`) for an imported path. If the
 * path isn't yet in the map, it is added; if it's already present, the
 * alias is set or replaced. The input map is not mutated.
 *
 * @param importMap - The import map to extend.
 * @param path - The full Rust path being aliased (e.g. `'foo::Bar'`).
 * @param alias - The local name to use (e.g. `'Baz'`).
 * @return A new frozen import map with the alias recorded.
 *
 * @example
 * ```ts
 * import { addAliasToImportMap, createImportMap } from '@codama/fragments/rust';
 *
 * const map = addAliasToImportMap(
 *     createImportMap(),
 *     'solana_program::program_error::ProgramError',
 *     'ProgError',
 * );
 * ```
 */
export function addAliasToImportMap(importMap: ImportMap, path: ImportPath, alias: Alias): ImportMap {
    const next = new Map(importMap);
    next.set(path, Object.freeze({ alias, importedPath: path }));
    return Object.freeze(next);
}
