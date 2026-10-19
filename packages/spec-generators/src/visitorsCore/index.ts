import {
    createRenderMap,
    deleteDirectory,
    type Fragment,
    mergeRenderMaps,
    type Path,
    type RenderMap,
    writeRenderMap,
} from '@codama/fragments/javascript';
import type { Spec } from '@codama/spec';

import { NODE_CONFIGS } from '../nodes';
import {
    getIndexPagesRenderMap,
    getPageFragment,
    resolveEntryPath,
    type SymbolicModule,
    withBaseAttributes,
} from '../shared';
import { getIdentityVisitorFragment, getMergeVisitorFragment, getNodeTestPathsFragment } from './fragments';
import {
    buildRenderScope,
    type GenerateOptions,
    type RenderOptions,
    type RenderScope,
    validateRenderOptions,
} from './options';

export {
    type GenerateOptions,
    IDENTITY_VISITOR_WALK_ORDER,
    KINDS_CONSTANT_UNIONS,
    MERGE_VISITOR_WALK_ORDER,
    type RenderOptions,
    validateRenderOptions,
} from './options';

/**
 * Build the render map and write it to disk under `options.outputDir`.
 * The target directory is wiped before each run so stale files cannot
 * survive. No formatter is applied — chain `lint:fix` afterwards.
 */
export function generateVisitorsCore(spec: Spec, options: GenerateOptions): void {
    const renderMap = getRenderMap(spec, options);
    deleteDirectory(options.outputDir);
    writeRenderMap(renderMap, options.outputDir);
}

/** Pure-and-sync render-map entry point. Tests can call this directly without touching the filesystem. */
export function getRenderMap(spec: Spec, options: RenderOptions): RenderMap<Fragment> {
    // Validate against the raw spec; render from the base-appended spec so
    // `plugins` surfaces on every node as an ordinary trailing child.
    validateRenderOptions(spec, options);
    const augmentedSpec = withBaseAttributes(spec);
    const scope = buildRenderScope(options);
    const publicPages = getPublicPagesRenderMap(augmentedSpec, scope);
    const testPages = getTestPagesRenderMap(augmentedSpec, scope);
    // Only public pages are re-exported, so test-only pages stay out of the package's API.
    const indexPages = getIndexPagesRenderMap(publicPages, scope.symbolicModules);
    return mergeRenderMaps([publicPages, testPages, indexPages]);
}

/** Emit one page per visitor, at the root of the generator's output directory. */
function getPublicPagesRenderMap(spec: Spec, scope: RenderScope): RenderMap<Fragment> {
    return createPagesRenderMap(scope, [
        ['visitor:identityVisitor', getIdentityVisitorFragment(spec, NODE_CONFIGS, scope)],
        ['visitor:mergeVisitor', getMergeVisitorFragment(spec, scope)],
    ]);
}

/**
 * Emit the test-path coverage map, at the root of the generator's output
 * directory. Tests import it directly, as it is not part of the index.
 */
function getTestPagesRenderMap(spec: Spec, scope: RenderScope): RenderMap<Fragment> {
    return createPagesRenderMap(scope, [['visitor:nodeTestPaths', getNodeTestPathsFragment(spec, scope)]]);
}

/** Wrap each body into a page at the path its symbolic module resolves to. */
function createPagesRenderMap(
    scope: RenderScope,
    pages: readonly (readonly [SymbolicModule, Fragment])[],
): RenderMap<Fragment> {
    const entries: Record<Path, Fragment> = {};
    for (const [symbolicKey, body] of pages) {
        const path = resolveEntryPath(scope.symbolicModules, symbolicKey);
        entries[`${path}.ts`] = getPageFragment(body, scope.symbolicModules, path);
    }
    return createRenderMap(entries);
}
