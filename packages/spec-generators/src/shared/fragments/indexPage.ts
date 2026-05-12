import {
    createRenderMap,
    type Fragment,
    getExportAllFragment,
    mergeFragments,
    type Path,
    pathBasename,
    pathDirectory,
    type RenderMap,
} from '@codama/fragments/javascript';

import type { SymbolicModuleMap } from '../symbolicModule';
import { getPageFragment } from './page';

/**
 * Build the per-folder and root `index.ts` re-export pages from a set
 * of already-emitted spec pages. Each `index.ts` lists subdirectory
 * re-exports plus any top-level files at the root level.
 */
export function getIndexPagesRenderMap(
    specPages: RenderMap<Fragment>,
    modules: SymbolicModuleMap,
): RenderMap<Fragment> {
    const filesByFolder = groupPathsByFolder([...specPages.keys()]);
    const entries: Record<Path, Fragment> = {};

    const topLevelFiles = filesByFolder.get('') ?? [];
    const subdirs: string[] = [];
    for (const [folder, names] of filesByFolder) {
        if (folder === '') continue;
        entries[`${folder}/index.ts`] = getPageFragment(getIndexPageFragment(names), modules, `${folder}/index`);
        subdirs.push(folder);
    }

    const topLevelIndex = topLevelFiles.length > 0 ? getIndexPageFragment(topLevelFiles) : undefined;
    const subdirsIndex = subdirs.length > 0 ? getIndexPageFragment(subdirs) : undefined;
    const rootBody = mergeFragments([topLevelIndex, subdirsIndex], parts => parts.join('\n\n'));
    entries['index.ts'] = getPageFragment(rootBody, modules, 'index');

    return createRenderMap(entries);
}

/**
 * Render an `index.ts` page body that alphabetically `export * from
 * './<name>';`s every supplied name. The caller wraps this in a
 * page-level renderer to add imports / EOL handling.
 */
export function getIndexPageFragment(names: readonly string[]): Fragment {
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    return mergeFragments(
        sorted.map(name => getExportAllFragment(`./${name}`)),
        parts => parts.join('\n'),
    );
}

/**
 * Group `.ts`-suffixed paths by their parent folder. Top-level files
 * (no slash) land under the `''` key. The `.ts` extension is stripped
 * from each basename so the result feeds directly into
 * {@link getIndexPageFragment}.
 */
export function groupPathsByFolder(paths: readonly Path[]): Map<string, string[]> {
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
