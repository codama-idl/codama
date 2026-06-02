import type { ImportMap } from './ImportMap';
import { createImportMap } from './ImportMap';

/**
 * Merge multiple import maps into one. Paths from later maps are layered
 * over earlier ones; if the same path appears in multiple maps, the
 * latest occurrence's alias info wins.
 *
 * The merge is a pure function: input maps are not mutated. The returned
 * map is frozen.
 *
 * @param importMaps - The import maps to merge, in priority order.
 * @return A frozen import map containing every entry from every input.
 *
 * @example
 * ```ts
 * import { addToImportMap, createImportMap, mergeImportMaps } from '@codama/fragments/rust';
 *
 * const a = addToImportMap(createImportMap(), ['borsh::BorshDeserialize']);
 * const b = addToImportMap(createImportMap(), ['solana_program::pubkey::Pubkey']);
 * const merged = mergeImportMaps([a, b]);
 * ```
 */
export function mergeImportMaps(importMaps: readonly ImportMap[]): ImportMap {
    if (importMaps.length === 0) return createImportMap();
    if (importMaps.length === 1) return importMaps[0];
    const merged = new Map(importMaps[0]);
    for (const map of importMaps.slice(1)) {
        for (const [path, info] of map) {
            merged.set(path, info);
        }
    }
    return Object.freeze(merged);
}
