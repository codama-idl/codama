import {
    type Fragment,
    fragment,
    getDocblockFragment,
    mergeFragments,
    pascalCase,
    use,
} from '@codama/fragments/javascript';
import type { NestedUnionSpec } from '@codama/spec';

import { getTypeExprFragment } from './typeExpr';

export function getNestedUnionFragment(nu: NestedUnionSpec): Fragment {
    const sortedWrappers = [...nu.wrappers].sort();
    const aliasName = pascalCase(nu.name);
    const baseFragment = getTypeExprFragment(nu.base);
    const wrapperRefs = sortedWrappers.map(kind => use(`type ${pascalCase(kind)}`, `node:${kind}`));
    const docComment = getDocblockFragment(nu.docs, { withLineJump: true });

    const arms = mergeFragments(
        wrapperRefs.map(w => fragment`| ${w}<${aliasName}<TType>>`),
        parts => parts.join('\n'),
    );
    return fragment`${docComment}export type ${aliasName}<TType extends ${baseFragment}> =\n${arms}\n| TType;`;
}
