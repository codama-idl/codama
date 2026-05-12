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
 * | undefined` when the attribute is optional). Callers must only
 * invoke this for attributes that already surface as type parameters.
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
    const constraint = attr.optional === true ? fragment`${baseFragment} | undefined` : baseFragment;
    return fragment`${identifier} extends ${constraint} = ${constraint}`;
}
