import {
    type Fragment,
    fragment,
    type ImportInfo,
    importMapToString,
    mergeFragments,
    mergeImportMaps,
    type Module,
    type Path,
    type UsedIdentifier,
} from '@codama/fragments/javascript';

import { relativeImportPath, type RenderScope, type SymbolicModule } from '../utils/scope';

/**
 * Render a fully-resolved TS page from a renderer's symbolic-keyed
 * fragment: rewrite the import map to relative paths against
 * `currentPath` (dropping self-imports, throwing on unknown keys),
 * then prepend the stringified import block to the body content.
 */
export function getPageFragment(
    body: Fragment,
    scope: Pick<RenderScope, 'symbolicModules'>,
    currentPath: Path,
): Fragment {
    const resolved = resolveFragmentImports(body, scope, currentPath);
    const importBlock = resolved.imports.size > 0 ? fragment`${importMapToString(resolved.imports)}` : undefined;
    return mergeFragments([importBlock, resolved], parts => parts.join('\n\n').trimEnd() + '\n');
}

function resolveFragmentImports(
    body: Fragment,
    scope: Pick<RenderScope, 'symbolicModules'>,
    currentPath: Path,
): Fragment {
    if (body.imports.size === 0) return body;
    const resolvedMaps = [...body.imports.entries()].flatMap(([symbolicModule, identifiers]) => {
        // The fragment library types `Module` as a bare `string`, but
        // every key in this map originated from a `use(..., '<flavour>:<entity>')`
        // call so it is a SymbolicModule in practice.
        const target = scope.symbolicModules.get(symbolicModule as SymbolicModule);
        if (target === undefined) {
            throw new Error(
                `@codama/node-types generator: unknown symbolic module "${symbolicModule}" referenced from "${currentPath}". ` +
                    `Add an entry to the RenderScope.`,
            );
        }
        if (target === currentPath) return [];
        const resolvedPath = relativeImportPath(currentPath, target);
        return [new Map<Module, ReadonlyMap<UsedIdentifier, ImportInfo>>([[resolvedPath, identifiers]])];
    });
    return Object.freeze({ ...body, imports: mergeImportMaps(resolvedMaps) });
}
