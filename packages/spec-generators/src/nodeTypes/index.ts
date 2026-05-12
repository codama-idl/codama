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

import { getIndexPagesRenderMap, getPageFragment, resolveEntryPath, type SymbolicModule } from '../shared';
import {
    getCodamaVersionFragment,
    getEnumerationFragment,
    getNestedUnionFragment,
    getNodeFragment,
    getNodeRegistryFragment,
    getUnionFragment,
} from './fragments';
import {
    buildRenderScope,
    type GenerateOptions,
    type RenderOptions,
    type RenderScope,
    validateRenderOptions,
} from './options';

export {
    CATEGORY_DIRECTORIES,
    type GenerateOptions,
    GENERIC_PARAM_ORDER,
    NARROWABLE_DATA_ATTRIBUTES,
    type RenderOptions,
    validateRenderOptions,
} from './options';

/**
 * Build the render map and write it to disk under `options.outputDir`.
 * The target directory is wiped before each run so stale files cannot
 * survive. No formatter is applied — chain `lint:fix` afterwards.
 */
export function generateNodeTypes(spec: Spec, options: GenerateOptions): void {
    const renderMap = getRenderMap(spec, options);
    deleteDirectory(options.outputDir);
    writeRenderMap(renderMap, options.outputDir);
}

/** Pure-and-sync render-map entry point. Tests can call this directly without touching the filesystem. */
export function getRenderMap(spec: Spec, options: RenderOptions): RenderMap<Fragment> {
    validateRenderOptions(spec, options);
    const scope = buildRenderScope(spec, options);
    const specPages = getSpecPagesRenderMap(spec, scope);
    const indexPages = getIndexPagesRenderMap(specPages, scope.symbolicModules);
    return mergeRenderMaps([specPages, indexPages]);
}

/** Walk every spec category plus the top-level `Node` registry and return one rendered page per emitted symbolic key. */
function getSpecPagesRenderMap(spec: Spec, scope: RenderScope): RenderMap<Fragment> {
    const entries: Record<Path, Fragment> = {};
    const emit = (symbolicKey: SymbolicModule, body: Fragment): void => {
        const path = resolveEntryPath(scope.symbolicModules, symbolicKey);
        entries[`${path}.ts`] = getPageFragment(body, scope.symbolicModules, path);
    };

    for (const category of spec.categories) {
        for (const n of category.nodes) emit(`node:${n.kind}`, getNodeFragment(n, scope));
        for (const u of category.unions) emit(`union:${u.name}`, getUnionFragment(u));
        for (const e of category.enumerations) emit(`enumeration:${e.name}`, getEnumerationFragment(e));
        for (const nu of category.nestedUnions) emit(`nestedUnion:${nu.name}`, getNestedUnionFragment(nu));
        if (category.name === 'shared') {
            emit('version:CodamaVersion', getCodamaVersionFragment(spec.version));
        }
    }
    emit('registry:Node', getNodeRegistryFragment(spec));

    return createRenderMap(entries);
}
