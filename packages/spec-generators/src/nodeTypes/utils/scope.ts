import { camelCase, joinPath, pascalCase, type Path, pathDirectory, relativePath } from '@codama/fragments/javascript';
import type { Spec } from '@codama/spec';

import { type RenderOptions, type ResolvedRenderOptions, resolveRenderOptions } from '../options';

/**
 * A `<kind>:<entity>` symbolic module string used as the second
 * argument to `use(...)` inside renderers. Flavours:
 *
 *   - `node:<nodeKind>`, `union:<UnionName>`, `enumeration:<EnumName>`,
 *     `nestedUnion:<AliasName>` — derived from the spec.
 *   - `brand:<BrandName>`, `docs:Docs`, `version:Version`,
 *     `version:CodamaVersion` — hand-written sibling files.
 *   - `registry:Node` / `registry:NodeKind` / `registry:GetNodeFromKind` —
 *     identifiers from the top-level `Node.ts` registry file.
 */
export type SymbolicModule = `${string}:${string}`;

/**
 * Runtime context threaded through every fragment renderer. Extends
 * the resolved {@link RenderOptions} so individual fragments can
 * declare — via `Pick<RenderScope, ...>` — exactly which knobs they
 * consult. {@link symbolicModules} is the layout knowledge used by
 * {@link getPageFragment} to resolve symbolic imports.
 *
 * A {@link Path} value is a slashless, extension-less location inside
 * `generated/` (e.g. `'AccountNode'`, `'typeNodes/StructTypeNode'`).
 * A leading `../` denotes a hand-written sibling above `generated/`.
 */
export interface RenderScope extends ResolvedRenderOptions {
    readonly symbolicModules: ReadonlyMap<SymbolicModule, Path>;
}

/** Hand-written branded-string types, living above `generated/`. */
const BRAND_NAMES: readonly string[] = [
    'CamelCaseString',
    'KebabCaseString',
    'PascalCaseString',
    'SnakeCaseString',
    'TitleCaseString',
];

export function buildRenderScope(spec: Spec, options: RenderOptions): RenderScope {
    const resolved = resolveRenderOptions(options);
    const symbolicModules = new Map<SymbolicModule, Path>();

    for (const category of spec.categories) {
        const folder = resolved.categoryDirectories.get(category.name);
        if (folder === undefined) {
            throw new Error(
                `@codama/node-types generator: unknown category "${category.name}". Extend categoryDirectories.`,
            );
        }
        for (const node of category.nodes) {
            symbolicModules.set(`node:${node.kind}`, joinPath(folder, pascalCase(node.kind)));
        }
        for (const union of category.unions) {
            symbolicModules.set(`union:${union.name}`, joinPath(folder, pascalCase(union.name)));
        }
        for (const enumeration of category.enumerations) {
            symbolicModules.set(`enumeration:${enumeration.name}`, joinPath(folder, camelCase(enumeration.name)));
        }
        for (const nestedUnion of category.nestedUnions) {
            symbolicModules.set(`nestedUnion:${nestedUnion.name}`, joinPath(folder, pascalCase(nestedUnion.name)));
        }
    }

    for (const brand of BRAND_NAMES) {
        symbolicModules.set(`brand:${brand}`, '../brands');
    }
    symbolicModules.set('docs:Docs', '../Docs');
    symbolicModules.set('version:Version', '../Version');

    const sharedDir = resolved.categoryDirectories.get('shared') ?? 'shared';
    symbolicModules.set('version:CodamaVersion', joinPath(sharedDir, 'codamaVersion'));

    symbolicModules.set('registry:Node', 'Node');
    symbolicModules.set('registry:NodeKind', 'Node');
    symbolicModules.set('registry:GetNodeFromKind', 'Node');

    return Object.freeze({
        ...resolved,
        symbolicModules: Object.freeze(symbolicModules),
    });
}

/**
 * Produce the relative import path from `currentPath` to `targetPath`.
 * Both omit the file extension. A `targetPath` starting with `../`
 * denotes a hand-written sibling above `generated/`.
 */
export function relativeImportPath(currentPath: Path, targetPath: Path): Path {
    if (currentPath === targetPath) {
        throw new Error(`@codama/node-types generator: refusing to produce a self-import for "${currentPath}".`);
    }
    const rel = relativePath(pathDirectory(currentPath), targetPath);
    return rel.startsWith('.') ? rel : `./${rel}`;
}
