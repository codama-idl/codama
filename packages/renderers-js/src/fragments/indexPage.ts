import { CamelCaseString } from '@codama/nodes';

import { Fragment, getExportAllFragment, mergeFragments } from '../utils';

export function getIndexPageFragment(items: { name: CamelCaseString }[]): Fragment | undefined {
    if (items.length === 0) return;

    const names = items
        .map(item => item.name)
        .sort((a, b) => a.localeCompare(b))
        .map(name => getExportAllFragment(`./${name}`));

    return mergeFragments(names, cs => cs.join('\n'));
}
