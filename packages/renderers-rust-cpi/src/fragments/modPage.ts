import { CamelCaseString, snakeCase } from '@codama/nodes';

import { Fragment, fragment, getPageFragment, mergeFragments, RenderScope } from '../utils';

export function getModPageFragment(
    scope: Pick<RenderScope, 'dependencyMap'> & { items: { name: CamelCaseString }[] },
): Fragment | undefined {
    const imports = getModImportsFragment(scope.items);
    if (!imports) return;

    return getPageFragment(imports, scope);
}

export function getModImportsFragment(items: { name: CamelCaseString }[]): Fragment | undefined {
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

    return mergeFragments([modStatements, useStatements], cs => cs.join('\n\n'));
}
