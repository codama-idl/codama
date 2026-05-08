import type { ImportMap, ImportPath } from './ImportMap';
import { mergeImportMaps } from './mergeImportMaps';

/**
 * Append imports to an import map, returning a new frozen map. The input
 * map is not mutated.
 *
 * Aliases are not added by this function — call
 * {@link addAliasToImportMap} separately when the import needs an `as`
 * clause.
 *
 * @param importMap - The import map to extend.
 * @param paths - The Rust paths to add. May be a single string, an array,
 * or a {@link Set}. An empty array short-circuits and returns `importMap`
 * unchanged.
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
    if (inputs.length === 0) return importMap;
    const additions = new Map<ImportPath, { importedPath: ImportPath }>();
    for (const path of inputs) {
        if (!additions.has(path) && !importMap.has(path)) {
            additions.set(path, Object.freeze({ importedPath: path }));
        }
    }
    if (additions.size === 0) return importMap;
    return mergeImportMaps([importMap, additions]);
}
