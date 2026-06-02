import type { ImportMap } from './ImportMap';
import { RUST_CORE_IMPORTS } from './ImportMap';
import { resolveImportMap } from './resolveImportMap';

/**
 * Compute the top-level crate names actually imported, with
 * {@link RUST_CORE_IMPORTS} excluded. Useful for syncing a renderer's
 * generated `Cargo.toml` from the imports it ends up emitting.
 *
 * Imports are first resolved against the dependency map (so symbolic
 * prefixes like `'generated::…'` are expanded before crate names are
 * extracted), then the leading `::` segment of each path is collected.
 *
 * @param importMap - The import map to inspect.
 * @param dependencies - The dependency map to apply before extracting
 * crate names. Defaults to no resolution.
 * @return A {@link Set} of external crate names.
 *
 * @example
 * ```ts
 * import { addToImportMap, createImportMap, getExternalDependencies } from '@codama/fragments/rust';
 *
 * const map = addToImportMap(createImportMap(), [
 *     'borsh::BorshSerialize',
 *     'std::collections::HashMap',
 *     'generated::accounts::A',
 * ]);
 * getExternalDependencies(map, { generated: 'crate::generated' });
 * // → Set { 'borsh' }
 * ```
 */
export function getExternalDependencies(importMap: ImportMap, dependencies: Record<string, string> = {}): Set<string> {
    const resolved = resolveImportMap(importMap, dependencies);
    const crates = new Set<string>();
    for (const path of resolved.keys()) {
        const root = path.split('::')[0];
        if (!RUST_CORE_IMPORTS.has(root)) crates.add(root);
    }
    return crates;
}
