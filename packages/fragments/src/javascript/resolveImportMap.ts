import type { ImportInfo, ImportMap, Module, UsedIdentifier } from './ImportMap';
import { mergeImportMaps } from './mergeImportMaps';

/**
 * Rewrite a JavaScript import map's module keys against a dependency map.
 *
 * Resolution is by exact module-name lookup: a module key `'solanaAddresses'`
 * against `{ solanaAddresses: '@solana/kit' }` becomes `'@solana/kit'`.
 * Keys that aren't present in `dependencies` are kept unchanged. The
 * inner `UsedIdentifier → ImportInfo` map for each module is preserved
 * exactly. When two source modules resolve to the same target, their
 * inner maps are merged via {@link mergeImportMaps}.
 *
 * Renderers typically pre-define a base set of symbolic modules
 * (`solanaAddresses → @solana/kit`, `generated → ..`, etc.) and pass
 * them through this function just before calling
 * {@link importMapToString} or {@link getExternalDependencies}.
 *
 * @param importMap - The import map to resolve.
 * @param dependencies - A record mapping symbolic module names to
 * resolved module specifiers.
 * @return A new frozen import map with all module keys resolved.
 *
 * @example
 * ```ts
 * import { addToImportMap, createImportMap, resolveImportMap } from '@codama/fragments/javascript';
 *
 * let map = createImportMap();
 * map = addToImportMap(map, 'solanaAddresses', ['Address']);
 * const resolved = resolveImportMap(map, { solanaAddresses: '@solana/kit' });
 * // resolved keys: ['@solana/kit']
 * ```
 */
export function resolveImportMap(importMap: ImportMap, dependencies: Record<string, string>): ImportMap {
    if (importMap.size === 0) return importMap;
    const perModule: ReadonlyMap<Module, ReadonlyMap<UsedIdentifier, ImportInfo>>[] = [...importMap.entries()].map(
        ([module, identifiers]) => {
            const resolvedModule = dependencies[module] ?? module;
            return new Map([[resolvedModule, identifiers]]);
        },
    );
    return mergeImportMaps(perModule);
}
