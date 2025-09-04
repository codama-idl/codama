import { CamelCaseString } from '@codama/nodes';

import { Fragment, getExportAllFragment, getPageFragment, mergeFragments, RenderScope } from '../utils';

export function getIndexPageFragment(
    items: { name: CamelCaseString }[],
    scope: Pick<RenderScope, 'dependencyMap' | 'useGranularImports'>,
): Fragment {
    const names = items
        .map(item => item.name)
        .sort((a, b) => a.localeCompare(b))
        .map(name => getExportAllFragment(`./${name}`));

    return getPageFragment(
        mergeFragments(names, cs => cs.join('\n')),
        scope,
    );
}
