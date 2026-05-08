import { type Fragment, getExportAllFragment, mergeFragments } from '@codama/fragments/javascript';

/** Render an `index.ts` page that alphabetically `export * from './<name>';`s every supplied name. */
export function getIndexPageFragment(names: readonly string[]): Fragment {
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    return mergeFragments(
        sorted.map(name => getExportAllFragment(`./${name}`)),
        parts => parts.join('\n'),
    );
}
