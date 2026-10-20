import type { ImportInfo, ImportMap, ImportPath, UsedIdentifier } from './ImportMap';
import { getDefaultUsedIdentifier } from './ImportMap';
import { mergeImportMaps } from './mergeImportMaps';

/**
 * Append plain imports (`use foo::Bar;`) to an import map, returning a new
 * frozen map. Each path is bound to its last segment (see
 * {@link getDefaultUsedIdentifier}). The input map is not mutated.
 *
 * Any alias already recorded for a path is kept alongside the plain
 * import. Call {@link addAliasToImportMap} when the import needs an `as`
 * clause.
 *
 * @param importMap - The import map to extend.
 * @param paths - The Rust paths to add. May be a single string, an array,
 * or a {@link Set}. When every path is already imported plainly, the
 * function short-circuits and returns `importMap` unchanged.
 * @return A frozen import map that includes the new entries.
 *
 * @example
 * ```ts
 * import { addToImportMap, createImportMap } from '@codama/fragments/rust';
 *
 * const map = addToImportMap(createImportMap(), [
 *     'borsh::BorshDeserialize',
 *     'borsh::BorshSerialize',
 * ]);
 * ```
 */
export function addToImportMap(
    importMap: ImportMap,
    paths: ReadonlySet<string> | string | readonly string[],
): ImportMap {
    const inputs = typeof paths === 'string' ? [paths] : [...paths];
    const additions = new Map<ImportPath, ReadonlyMap<UsedIdentifier, ImportInfo>>();
    for (const path of inputs) {
        const usedIdentifier = getDefaultUsedIdentifier(path);
        if (importMap.get(path)?.has(usedIdentifier)) continue;
        const info: ImportInfo = Object.freeze({ importedPath: path, usedIdentifier });
        additions.set(path, Object.freeze(new Map([[usedIdentifier, info]])));
    }
    if (additions.size === 0) return importMap;
    return mergeImportMaps([importMap, additions]);
}
