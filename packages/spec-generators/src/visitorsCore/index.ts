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
import { getIndexPagesRenderMap, getPageFragment, resolveEntryPath, type SymbolicModule } from '../shared';
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
    MERGE_VISITOR_WALK_ORDER,
    type RenderOptions,
    UNION_ALIAS_NAMES,
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
    validateRenderOptions(spec, options);
    const scope = buildRenderScope(options);
    const specPages = getSpecPagesRenderMap(spec, scope);
    const indexPages = getIndexPagesRenderMap(specPages, scope.symbolicModules);
    return mergeRenderMaps([specPages, indexPages]);
}

/**
 * Emit one page per visitor plus the test-path coverage map. Three
 * files in total, all at the root of the generator's output directory.
 */
function getSpecPagesRenderMap(spec: Spec, scope: RenderScope): RenderMap<Fragment> {
    const entries: Record<Path, Fragment> = {};
    const emit = (symbolicKey: SymbolicModule, body: Fragment): void => {
        const path = resolveEntryPath(scope.symbolicModules, symbolicKey);
        entries[`${path}.ts`] = getPageFragment(body, scope.symbolicModules, path);
    };

    emit('visitor:identityVisitor', getIdentityVisitorFragment(spec, NODE_CONFIGS, scope));
    emit('visitor:mergeVisitor', getMergeVisitorFragment(spec, scope));
    emit('visitor:nodeTestPaths', getNodeTestPathsFragment(spec, scope));

    return createRenderMap(entries);
}
