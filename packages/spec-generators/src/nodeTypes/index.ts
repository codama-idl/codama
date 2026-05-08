import {
    createRenderMap,
    deleteDirectory,
    type Fragment,
    mergeFragments,
    mergeRenderMaps,
    type Path,
    pathBasename,
    pathDirectory,
    type RenderMap,
    writeRenderMap,
} from '@codama/fragments/javascript';
import type { Spec } from '@codama/spec';

import {
    getCodamaVersionFragment,
    getEnumerationFragment,
    getIndexPageFragment,
    getNestedUnionFragment,
    getNodeFragment,
    getNodeRegistryFragment,
    getPageFragment,
    getUnionFragment,
} from './fragments';
import { type GenerateOptions, type RenderOptions, validateRenderOptions } from './options';
import { buildRenderScope, type RenderScope, type SymbolicModule } from './utils';

export {
    CATEGORY_DIRECTORIES,
    type GenerateOptions,
    GENERIC_PARAM_ORDER,
    NARROWABLE_DATA_ATTRIBUTES,
    type RenderOptions,
    validateRenderOptions,
} from './options';

/**
 * Build the render map and write it to disk under `outputDir`. The
 * target directory is wiped before each run so stale files cannot
 * survive. No formatter is applied — chain `lint:fix` afterwards.
 */
export function generateNodeTypes(spec: Spec, options: GenerateOptions): void {
    const renderMap = getRenderMap(spec, options);
    deleteDirectory(options.outputDir);
    writeRenderMap(renderMap, options.outputDir);
}

/**
 * Walk the spec and assemble every file the generator produces into a
 * single {@link RenderMap}, keyed by `.ts`-suffixed paths. Pure and
 * sync: tests can call this directly without touching the filesystem.
 */
export function getRenderMap(spec: Spec, options: RenderOptions): RenderMap<Fragment> {
    validateRenderOptions(spec, options);
    const scope = buildRenderScope(spec, options);
    const specPages = getSpecPagesRenderMap(spec, scope);
    const indexPages = getIndexPagesRenderMap(specPages, scope);
    return mergeRenderMaps([specPages, indexPages]);
}

/**
 * Walk every spec category plus the top-level `Node` registry and
 * return one rendered page per emitted symbolic key.
 */
function getSpecPagesRenderMap(spec: Spec, scope: RenderScope): RenderMap<Fragment> {
    const entries: Record<Path, Fragment> = {};
    const emit = (symbolicKey: SymbolicModule, body: Fragment): void => {
        const path = resolveEntryPath(scope, symbolicKey);
        entries[`${path}.ts`] = getPageFragment(body, scope, path);
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

/**
 * Build the per-folder and root `index.ts` re-export pages from a set
 * of already-emitted spec pages.
 */
function getIndexPagesRenderMap(specPages: RenderMap<Fragment>, scope: RenderScope): RenderMap<Fragment> {
    const filesByFolder = groupPathsByFolder([...specPages.keys()]);
    const entries: Record<Path, Fragment> = {};

    const topLevelFiles = filesByFolder.get('') ?? [];
    const subdirs: string[] = [];
    for (const [folder, names] of filesByFolder) {
        if (folder === '') continue;
        entries[`${folder}/index.ts`] = getPageFragment(getIndexPageFragment(names), scope, `${folder}/index`);
        subdirs.push(folder);
    }

    const topLevelIndex = topLevelFiles.length > 0 ? getIndexPageFragment(topLevelFiles) : undefined;
    const subdirsIndex = subdirs.length > 0 ? getIndexPageFragment(subdirs) : undefined;
    const rootBody = mergeFragments([topLevelIndex, subdirsIndex], parts => parts.join('\n\n'));
    entries['index.ts'] = getPageFragment(rootBody, scope, 'index');

    return createRenderMap(entries);
}

/** Resolve a symbolic key to a safe output path, throwing if missing or pointing outside `generated/`. */
function resolveEntryPath(scope: RenderScope, symbolicKey: SymbolicModule): Path {
    const path = scope.symbolicModules.get(symbolicKey);
    if (path === undefined) {
        throw new Error(`@codama/node-types generator: missing symbolic key "${symbolicKey}" in scope.`);
    }
    if (path.startsWith('../')) {
        throw new Error(
            `@codama/node-types generator: refusing to emit "${symbolicKey}" — its location "${path}" points outside generated/.`,
        );
    }
    return path;
}

/**
 * Group `.ts`-suffixed paths by their parent folder. Top-level files
 * (no slash) land under the `''` key. The `.ts` extension is stripped
 * from each basename so the result feeds directly into
 * {@link getIndexPageFragment}.
 */
function groupPathsByFolder(paths: readonly Path[]): Map<string, string[]> {
    const byFolder = new Map<string, string[]>();
    for (const path of paths) {
        const withoutExtension = path.endsWith('.ts') ? path.slice(0, -3) : path;
        // `pathDirectory('AccountNode')` returns `'.'` on Node; normalise
        // to `''` so the top-level sentinel stays consistent.
        const directory = pathDirectory(withoutExtension);
        const folder = directory === '.' ? '' : directory;
        const basename = pathBasename(withoutExtension);
        const names = byFolder.get(folder) ?? [];
        names.push(basename);
        byFolder.set(folder, names);
    }
    return byFolder;
}
