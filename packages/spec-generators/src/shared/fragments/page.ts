import {
    type Fragment,
    fragment,
    type ImportInfo,
    importMapToString,
    mergeFragments,
    mergeImportMaps,
    type Module,
    type Path,
    pathDirectory,
    relativePath,
    type UsedIdentifier,
} from '@codama/fragments/javascript';

import { type SymbolicModule, type SymbolicModuleMap } from '../symbolicModule';

/**
 * A `<flavour>:<name>` symbolic key. The flavour part is camelCase
 * (`node`, `nestedUnion`, `constructor`, …). Anything that doesn't
 * match (e.g. a bare `'@codama/node-types'` package specifier) is
 * treated as already-resolved and passes through to the import block
 * verbatim.
 */
const SYMBOLIC_KEY_PATTERN = /^[a-z][a-zA-Z]*:/;

/**
 * Render a fully-resolved TS page from a renderer's symbolic-keyed
 * fragment: rewrite the import map to relative paths against
 * `currentPath` (dropping self-imports, passing bare specifiers
 * through, throwing on unknown symbolic keys), then prepend the
 * stringified import block to the body content.
 */
export function getPageFragment(body: Fragment, modules: SymbolicModuleMap, currentPath: Path): Fragment {
    const resolved = resolveFragmentImports(body, modules, currentPath);
    const importBlock = resolved.imports.size > 0 ? fragment`${importMapToString(resolved.imports)}` : undefined;
    return mergeFragments([importBlock, resolved], parts => parts.join('\n\n').trimEnd() + '\n');
}

function resolveFragmentImports(body: Fragment, modules: SymbolicModuleMap, currentPath: Path): Fragment {
    if (body.imports.size === 0) return body;
    const resolvedMaps = [...body.imports.entries()].flatMap(([module, identifiers]) => {
        if (!SYMBOLIC_KEY_PATTERN.test(module)) {
            return [new Map<Module, ReadonlyMap<UsedIdentifier, ImportInfo>>([[module, identifiers]])];
        }
        const target = modules.get(module as SymbolicModule);
        if (target === undefined) {
            throw new Error(`unknown symbolic module "${module}" referenced from "${currentPath}".`);
        }
        if (target === currentPath) return [];
        const resolvedPath = relativeImportPath(currentPath, target);
        return [new Map<Module, ReadonlyMap<UsedIdentifier, ImportInfo>>([[resolvedPath, identifiers]])];
    });
    return Object.freeze({ ...body, imports: mergeImportMaps(resolvedMaps) });
}

function relativeImportPath(currentPath: Path, targetPath: Path): Path {
    if (currentPath === targetPath) {
        throw new Error(`refusing to produce a self-import for "${currentPath}".`);
    }
    const rel = relativePath(pathDirectory(currentPath), targetPath);
    return rel.startsWith('.') ? rel : `./${rel}`;
}
