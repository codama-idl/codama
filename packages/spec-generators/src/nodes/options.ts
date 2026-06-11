import { joinPath, pascalCase, type Path } from '@codama/fragments/javascript';
import type { Spec } from '@codama/spec';

import {
    resolveSharedRenderOptions,
    type SharedRenderOptions,
    type SymbolicModule,
    type SymbolicModuleMap,
    validateSharedRenderOptions,
} from '../shared';
import { NODE_CONFIGS, type NodeConstructorConfig, validateNodeConfigs } from './config';

export {
    CATEGORY_DIRECTORIES,
    GENERIC_PARAM_ORDER,
    getNodeTypeParameterAttributes,
    isNodeTypeParameterAttribute,
    NARROWABLE_DATA_ATTRIBUTES,
} from '../shared';
export { type AttributeOverride, NODE_CONFIGS, type NodeConstructorConfig } from './config';

/** User-facing options for the `@codama/nodes` generator. */
export interface RenderOptions extends SharedRenderOptions {
    /**
     * Per-node constructor configuration: positional args, attribute
     * overrides, defaults, coercions. Omitted means "use the v1
     * defaults" ({@link NODE_CONFIGS}).
     */
    readonly nodeConfigs?: ReadonlyMap<string, NodeConstructorConfig>;
}

/** Options consumed by {@link generateNodes}, the disk-writing entry point. */
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
 *   - `constructor:<nodeKind>` — a sibling node-constructor file.
 *   - `kinds:<UnionName>`      — a generated runtime kinds array.
 *   - `kinds:Node`             — the top-level `nodeKinds` registry.
 *   - `generated:CodamaVersion` — the generated `codamaVersion` constant.
 *   - `shared:<symbol>`        — a hand-written sibling utility above
 *                                `generated/` (`camelCase`, `DocsInput`,
 *                                `isNode`, `parseDocs`).
 *
 * Imports from `@codama/node-types` do NOT use this resolver: renderers
 * call `use(<identifier>, '@codama/node-types')` directly and the
 * fragment pipeline passes the bare specifier through.
 */
export interface RenderScope extends ResolvedRenderOptions {
    readonly symbolicModules: SymbolicModuleMap;
}

export function resolveRenderOptions(options: RenderOptions): ResolvedRenderOptions {
    return {
        ...resolveSharedRenderOptions(options),
        nodeConfigs: options.nodeConfigs ?? NODE_CONFIGS,
    };
}

export function validateRenderOptions(spec: Spec, options: RenderOptions): void {
    validateSharedRenderOptions(spec, options);
    validateNodeConfigs(spec, options.nodeConfigs ?? NODE_CONFIGS);
}

/**
 * Hand-written sibling files at `@codama/nodes/src/`, one directory
 * above `generated/`. Each entry's leading `../` makes the relative
 * import resolve to `'../<file>'` from a top-level generated file or
 * `'../../<file>'` from a subdirectory file.
 */
const SHARED_HELPER_PATHS: Readonly<Record<string, Path>> = Object.freeze({
    DocsInput: '../shared',
    camelCase: '../shared',
    isNode: '../Node',
    parseDocs: '../shared',
});

export function buildRenderScope(spec: Spec, options: RenderOptions): RenderScope {
    const resolved = resolveRenderOptions(options);
    const symbolicModules = new Map<SymbolicModule, Path>();

    for (const category of spec.categories) {
        const folder = resolved.categoryDirectories.get(category.name);
        if (folder === undefined) {
            throw new Error(`unknown category "${category.name}". Extend categoryDirectories.`);
        }
        for (const node of category.nodes) {
            symbolicModules.set(`constructor:${node.kind}`, joinPath(folder, pascalCase(node.kind)));
        }
        for (const union of category.unions) {
            symbolicModules.set(`kinds:${union.name}`, joinPath(folder, pascalCase(union.name)));
        }
    }

    symbolicModules.set('kinds:Node', 'nodeKinds');
    symbolicModules.set('generated:CodamaVersion', 'codamaVersion');

    for (const [name, path] of Object.entries(SHARED_HELPER_PATHS)) {
        symbolicModules.set(`shared:${name}`, path);
    }

    return Object.freeze({
        ...resolved,
        symbolicModules: Object.freeze(symbolicModules),
    });
}
