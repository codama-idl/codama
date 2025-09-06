import { CamelCaseString, snakeCase } from '@codama/nodes';

import { Fragment, fragment, getPageFragment, mergeFragments } from '../utils';

export function getModPageFragment(scope: { items: { name: CamelCaseString }[] }): Fragment | undefined {
    const { items } = scope;
    if (items.length === 0) return;

    const sortedItems = items.slice().sort((a, b) => a.name.localeCompare(b.name));
    const modStatements = mergeFragments(
        sortedItems.map(item => fragment`pub mod r#${snakeCase(item.name)};`),
        cs => cs.join('\n'),
    );
    const useStatements = mergeFragments(
        sortedItems.map(item => fragment`pub use self::r#${snakeCase(item.name)}::*;`),
        cs => cs.join('\n'),
    );

    return getPageFragment(mergeFragments([modStatements, useStatements], cs => cs.join('\n\n')));
}
