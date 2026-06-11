import { camelCase, joinPath, pascalCase, type Path } from '@codama/fragments/javascript';
import type { Spec } from '@codama/spec';

import {
    resolveSharedRenderOptions,
    type SharedRenderOptions,
    type SymbolicModule,
    type SymbolicModuleMap,
    validateSharedRenderOptions,
} from '../shared';

export {
    CATEGORY_DIRECTORIES,
    GENERIC_PARAM_ORDER,
    getNodeTypeParameterAttributes,
    isNodeTypeParameterAttribute,
    NARROWABLE_DATA_ATTRIBUTES,
} from '../shared';

/** User-facing options for the `@codama/node-types` generator. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RenderOptions extends SharedRenderOptions {}

/** Options consumed by {@link generateNodeTypes}, the disk-writing entry point. */
export interface GenerateOptions extends RenderOptions {
    readonly outputDir: Path;
}

/** {@link RenderOptions} with every defaultable field resolved. */
export type ResolvedRenderOptions = Required<RenderOptions>;

/**
 * Runtime context threaded through every fragment renderer. Carries
 * the resolved options plus the symbolic-module lookup table.
 *
 * Symbolic-module flavours emitted by this generator:
 *
 *   - `node:<nodeKind>`, `union:<UnionName>`, `enumeration:<EnumName>`,
 *     `nestedUnion:<AliasName>` — derived from the spec.
 *   - `brand:<BrandName>`, `docs:Docs`, `version:Version`,
 *     `version:CodamaVersion` — hand-written sibling files.
 *   - `registry:Node` / `registry:NodeKind` / `registry:GetNodeFromKind` —
 *     identifiers from the top-level `Node.ts` registry file.
 */
export interface RenderScope extends ResolvedRenderOptions {
    readonly symbolicModules: SymbolicModuleMap;
}

export function resolveRenderOptions(options: RenderOptions): ResolvedRenderOptions {
    return resolveSharedRenderOptions(options);
}

export function validateRenderOptions(spec: Spec, options: RenderOptions): void {
    validateSharedRenderOptions(spec, options);
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
            throw new Error(`unknown category "${category.name}". Extend categoryDirectories.`);
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
