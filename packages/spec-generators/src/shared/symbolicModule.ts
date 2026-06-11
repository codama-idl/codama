import { type Path } from '@codama/fragments/javascript';

/**
 * A `<flavour>:<entity>` symbolic module string used as the second
 * argument to `use(...)` inside renderers. Each generator owns its own
 * flavour vocabulary (`node:`, `union:`, `constructor:`, …); the page
 * renderer resolves these to relative paths via a {@link SymbolicModuleMap}.
 */
export type SymbolicModule = `${string}:${string}`;

/**
 * Resolved layout knowledge: maps every symbolic module key the
 * generator emits or references to the in-tree file path that exports
 * its identifier(s). Built once per generation run by each generator's
 * `buildRenderScope` and consumed by the shared page / index-page /
 * orchestration helpers.
 *
 * A {@link Path} value is a slashless, extension-less location inside
 * `generated/` (e.g. `'AccountNode'`, `'typeNodes/StructTypeNode'`).
 * A leading `../` denotes a hand-written sibling above `generated/`.
 */
export type SymbolicModuleMap = ReadonlyMap<SymbolicModule, Path>;

/**
 * Resolve a symbolic key to a safe output path. Throws if the key is
 * missing from the map or points outside `generated/`. Generators
 * that drive an `emit(key, body)` style closure call this from inside
 * their `getSpecPagesRenderMap`.
 */
export function resolveEntryPath(modules: SymbolicModuleMap, symbolicKey: SymbolicModule): Path {
    const path = modules.get(symbolicKey);
    if (path === undefined) {
        throw new Error(`missing symbolic key "${symbolicKey}" in scope.`);
    }
    if (path.startsWith('../')) {
        throw new Error(`refusing to emit "${symbolicKey}" — its location "${path}" points outside generated/.`);
    }
    return path;
}
