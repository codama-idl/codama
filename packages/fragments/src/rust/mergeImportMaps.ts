import type { ImportInfo, ImportMap, UsedIdentifier } from './ImportMap';
import { createImportMap } from './ImportMap';

/**
 * Merge multiple import maps into one. The result is the union of every
 * input: when the same path appears in several maps, it keeps every local
 * name it is imported under across all of them, so a fragment importing
 * `crate::Mint` plainly and another importing it `as TokenMint` both keep
 * the name their content relies on. Identical local names are recorded
 * once.
 *
 * The merge is a pure function: input maps are not mutated. The returned
 * map is frozen.
 *
 * @param importMaps - The import maps to merge.
 * @return A frozen import map containing every entry from every input.
 *
 * @example
 * ```ts
 * import { addAliasToImportMap, addToImportMap, createImportMap, mergeImportMaps } from '@codama/fragments/rust';
 *
 * const a = addToImportMap(createImportMap(), 'crate::Mint');
 * const b = addAliasToImportMap(createImportMap(), 'crate::Mint', 'TokenMint');
 * const merged = mergeImportMaps([a, b]);
 * // merged imports `crate::Mint` both as `Mint` and as `TokenMint`.
 * ```
 */
export function mergeImportMaps(importMaps: readonly ImportMap[]): ImportMap {
    if (importMaps.length === 0) return createImportMap();
    if (importMaps.length === 1) return importMaps[0];
    const merged = new Map(importMaps[0]);
    for (const map of importMaps.slice(1)) {
        for (const [path, infos] of map) {
            const existing = merged.get(path);
            merged.set(path, existing ? mergeUsedIdentifiers(existing, infos) : infos);
        }
    }
    return Object.freeze(merged);
}

function mergeUsedIdentifiers(
    existing: ReadonlyMap<UsedIdentifier, ImportInfo>,
    incoming: ReadonlyMap<UsedIdentifier, ImportInfo>,
): ReadonlyMap<UsedIdentifier, ImportInfo> {
    const next = new Map(existing);
    for (const [usedIdentifier, info] of incoming) {
        if (!next.has(usedIdentifier)) next.set(usedIdentifier, info);
    }
    return next.size === existing.size ? existing : Object.freeze(next);
}
