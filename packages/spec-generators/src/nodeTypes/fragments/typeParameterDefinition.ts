import { type Fragment, fragment } from '@codama/fragments/javascript';
import type { AttributeSpec } from '@codama/spec';

import { getTypeParameterIdentifierFragment } from '../../shared';
import { isTypeExprSelfReferential } from '../selfReference';
import { getTypeExprFragment, getTypeExprWithSelfAliasFragment } from './typeExpr';

export interface TypeParameterDefinitionOptions {
    /**
     * Substitute `selfAlias.alias` for direct `node` references to
     * `selfAlias.kind` inside the constraint and default. Used by
     * self-referential nodes to break TS's circular-default error.
     */
    readonly selfAlias?: {
        readonly alias: string;
        readonly kind: string;
    };
}

/**
 * Render the type-parameter definition for one type-parameter
 * attribute, e.g. `TData extends Foo = Foo` (or `… | undefined = …
 * | undefined` when the attribute is optional — or an array). Callers
 * must only invoke this for attributes that already surface as type
 * parameters.
 *
 * Array attributes always append `| undefined` because they
 * skip-when-empty: an empty array is omitted from the node, so the
 * attribute may always be absent (see the "Array attributes are omitted
 * when empty" convention in the `@codama/spec` README). This keeps the
 * interface's type-parameter constraint in lockstep with the node
 * function's (see `getNodeTypeParameterConstraint`).
 */
export function getTypeParameterDefinitionFragment(
    attr: AttributeSpec,
    options: TypeParameterDefinitionOptions = {},
): Fragment {
    const identifier = getTypeParameterIdentifierFragment(attr);
    const baseFragment =
        options.selfAlias && isTypeExprSelfReferential(attr.type, options.selfAlias.kind)
            ? getTypeExprWithSelfAliasFragment(attr.type, options.selfAlias.kind, options.selfAlias.alias)
            : getTypeExprFragment(attr.type);
    const constraint =
        attr.optional === true || attr.type.kind === 'array' ? fragment`${baseFragment} | undefined` : baseFragment;
    return fragment`${identifier} extends ${constraint} = ${constraint}`;
}
