import type { ImportInfo, ImportMap, Module, UsedIdentifier } from './ImportMap';
import { createImportMap } from './ImportMap';
import { preferIncoming } from './preferIncoming';

/**
 * Merge multiple import maps into one. Modules and identifiers from later
 * maps are layered over earlier ones. On a collision on the same
 * `usedIdentifier`, the existing entry stays unless the incoming one is a
 * value import of the same identifier replacing a type-only import.
 *
 * The merge is a pure function: input maps are not mutated. The returned map
 * is frozen.
 *
 * @param importMaps - The import maps to merge, in priority order.
 * @return A frozen import map that contains every entry from every input.
 *
 * @example
 * ```ts
 * import { addToImportMap, createImportMap, mergeImportMaps } from '@codama/fragments/javascript';
 *
 * const a = addToImportMap(createImportMap(), './foo', ['Foo']);
 * const b = addToImportMap(createImportMap(), './bar', ['Bar']);
 * const merged = mergeImportMaps([a, b]);
 * ```
 */
export function mergeImportMaps(importMaps: readonly ImportMap[]): ImportMap {
    if (importMaps.length === 0) return createImportMap();
    if (importMaps.length === 1) return importMaps[0];
    const merged = new Map(importMaps[0]);
    for (const map of importMaps.slice(1)) {
        for (const [module, imports] of map) {
            const moduleMap = new Map<UsedIdentifier, ImportInfo>(
                merged.get(module) ?? new Map<UsedIdentifier, ImportInfo>(),
            );
            for (const [usedIdentifier, info] of imports) {
                const existing = moduleMap.get(usedIdentifier);
                if (preferIncoming(existing, info)) {
                    moduleMap.set(usedIdentifier, info);
                }
            }
            merged.set(module, moduleMap);
        }
    }
    return Object.freeze(merged) as ReadonlyMap<Module, ReadonlyMap<UsedIdentifier, ImportInfo>>;
}
