import type { ImportInfo, ImportMap, Module, UsedIdentifier } from './ImportMap';
import { createImportMap } from './ImportMap';

/**
 * Merge multiple import maps into one. Modules and identifiers from later
 * maps are layered over earlier ones; collisions on the same `usedIdentifier`
 * are resolved by {@link preferIncoming}.
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

/**
 * Decide whether an incoming `ImportInfo` should replace an existing entry
 * for the same `usedIdentifier`.
 *
 * The single rule we apply: if both refer to the same source identifier and
 * one is type-only while the other is a value import, the value import wins.
 * In every other "tied" case the existing entry stays. This keeps a value
 * import from being silently downgraded to type-only when both are
 * encountered.
 */
export function preferIncoming(existing: ImportInfo | undefined, incoming: ImportInfo): boolean {
    if (!existing) return true;
    return existing.importedIdentifier === incoming.importedIdentifier && existing.isType && !incoming.isType;
}
