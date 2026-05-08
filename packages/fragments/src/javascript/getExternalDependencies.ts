import type { ImportMap } from './ImportMap';
import { resolveImportMap } from './resolveImportMap';

/**
 * Compute the set of external (non-relative) module specifiers an import
 * map references, with dependency-map resolution applied first. The
 * returned values are *root* package names — for `'@scope/pkg/sub'` the
 * value is `'@scope/pkg'`, and for `'pkg/sub'` it is `'pkg'`.
 *
 * Useful for syncing a renderer's generated `package.json` from the
 * imports it ends up emitting.
 *
 * @param importMap - The import map to inspect.
 * @param dependencies - The dependency map to apply before extracting
 * names. Defaults to no resolution.
 * @return A {@link Set} of external root package names.
 *
 * @example
 * ```ts
 * import { addToImportMap, createImportMap, getExternalDependencies } from '@codama/fragments/javascript';
 *
 * let map = createImportMap();
 * map = addToImportMap(map, '@solana/kit', ['Address']);
 * map = addToImportMap(map, '@solana/kit/program-client-core', ['ProgramClient']);
 * map = addToImportMap(map, '../shared', ['Local']);
 * getExternalDependencies(map);
 * // → Set { '@solana/kit' }
 * ```
 */
export function getExternalDependencies(importMap: ImportMap, dependencies: Record<string, string> = {}): Set<string> {
    const resolved = resolveImportMap(importMap, dependencies);
    const roots = new Set<string>();
    for (const module of resolved.keys()) {
        if (module.startsWith('.')) continue;
        const segments = module.split('/');
        const rootSegmentCount = module.startsWith('@') ? 2 : 1;
        roots.add(segments.slice(0, rootSegmentCount).join('/'));
    }
    return roots;
}
