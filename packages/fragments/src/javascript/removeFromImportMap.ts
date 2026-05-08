import type { ImportMap, Module, UsedIdentifier } from './ImportMap';

/**
 * Remove identifiers from a module entry. If the module ends up with no
 * remaining identifiers, the module entry itself is dropped from the map.
 *
 * @param importMap - The import map to modify.
 * @param module - The source module to remove identifiers from.
 * @param usedIdentifiers - The used-identifier names to drop. Names that
 * aren't present in the module entry are silently ignored.
 * @return A new frozen import map without those identifiers.
 *
 * @example
 * ```ts
 * import { addToImportMap, createImportMap, removeFromImportMap } from '@codama/fragments/javascript';
 *
 * let map = addToImportMap(createImportMap(), './foo', ['Foo', 'Bar']);
 * map = removeFromImportMap(map, './foo', ['Foo']);
 * ```
 */
export function removeFromImportMap(
    importMap: ImportMap,
    module: Module,
    usedIdentifiers: UsedIdentifier[],
): ImportMap {
    const next = new Map(importMap);
    const moduleMap = new Map(next.get(module));
    for (const id of usedIdentifiers) moduleMap.delete(id);
    if (moduleMap.size === 0) {
        next.delete(module);
    } else {
        next.set(module, moduleMap);
    }
    return Object.freeze(next);
}
