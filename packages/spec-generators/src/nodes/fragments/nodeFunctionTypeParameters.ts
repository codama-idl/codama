import { type Fragment, fragment, mergeFragments } from '@codama/fragments/javascript';
import type { AttributeSpec } from '@codama/spec';

import { getTypeParameterIdentifierFragment } from '../../shared';
import { getNodeTypeParameterConstraint } from './nodeTypeParameters';

/**
 * The `<const TA extends ConstraintA = DefaultA, …>` type-parameter
 * block on a node function.
 *
 * Every type parameter gets a `const` prefix: it's a no-op for
 * constraint-narrowed cases (`TFormat extends NumberFormat` already
 * narrows literal arguments via the union) and a strict win for the
 * array / object literal cases where TS would otherwise widen.
 */
export function getNodeFunctionTypeParametersFragment(
    typeParameterAttributes: readonly AttributeSpec[],
    constructorDefaults: readonly Fragment[],
): Fragment {
    if (typeParameterAttributes.length === 0) return fragment``;
    const parts = typeParameterAttributes.map((attr, i) => {
        const defaultExpr = constructorDefaults[i];
        const defaultClause = defaultExpr.content ? fragment` = ${defaultExpr}` : fragment``;
        return fragment`const ${getTypeParameterIdentifierFragment(attr)} extends ${getNodeTypeParameterConstraint(attr)}${defaultClause}`;
    });
    const joined = mergeFragments(parts, ps => ps.map(p => `${p},`).join('\n'));
    return fragment`<\n${joined}\n>`;
}
