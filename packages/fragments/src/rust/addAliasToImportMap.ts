import type { Alias, ImportInfo, ImportMap, ImportPath } from './ImportMap';
import { mergeImportMaps } from './mergeImportMaps';

/**
 * Import a path under an additional local name (`use foo::Bar as Baz;`).
 * The alias is added next to any name the path is already imported under,
 * so a plain import of the same path (`use foo::Bar;`) or another alias is
 * kept rather than replaced. If the alias is already recorded, `importMap`
 * is returned unchanged. The input map is not mutated.
 *
 * An alias equal to the last segment of the path is the same local name
 * as the plain import, so it renders as `use foo::Bar;`.
 *
 * @param importMap - The import map to extend.
 * @param path - The full Rust path being aliased (e.g. `'foo::Bar'`).
 * @param alias - The local name to use (e.g. `'Baz'`).
 * @return A frozen import map with the alias recorded.
 *
 * @example
 * ```ts
 * import { addAliasToImportMap, addToImportMap, createImportMap } from '@codama/fragments/rust';
 *
 * let map = addToImportMap(createImportMap(), 'crate::Mint');
 * map = addAliasToImportMap(map, 'crate::Mint', 'TokenMint');
 * // use crate::Mint;
 * // use crate::Mint as TokenMint;
 * ```
 */
export function addAliasToImportMap(importMap: ImportMap, path: ImportPath, alias: Alias): ImportMap {
    if (importMap.get(path)?.has(alias)) return importMap;
    const info: ImportInfo = Object.freeze({ importedPath: path, usedIdentifier: alias });
    return mergeImportMaps([importMap, new Map([[path, Object.freeze(new Map([[alias, info]]))]])]);
}
