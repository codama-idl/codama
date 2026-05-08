import { type Fragment, fragment, getDocblockFragment } from '@codama/fragments/javascript';
import type { AttributeSpec } from '@codama/spec';

import { isAttributeLifted } from '../options';
import type { RenderScope } from '../utils/scope';
import { getTypeExprFragment } from './typeExpr';
import { getTypeParameterIdentifierFragment } from './typeParameterIdentifier';

/**
 * Render one attribute as a body line inside an interface declaration.
 * Lifted attributes use their type-parameter identifier (e.g.
 * `readonly data: TData;`); non-lifted attributes use the rendered
 * type expression. Optional attributes carry a `?:` marker; `docs`
 * (if any) become a JSDoc prefix.
 */
export function getAttributeBodyLineFragment(
    nodeKind: string,
    attr: AttributeSpec,
    scope: Pick<RenderScope, 'narrowableDataAttributes'>,
): Fragment {
    const docPrefix = getDocblockFragment(attr.docs, { withLineJump: true });
    const optionalMark = attr.optional === true ? '?' : '';
    const typeFragment = isAttributeLifted(nodeKind, attr, scope)
        ? getTypeParameterIdentifierFragment(attr.name)
        : getTypeExprFragment(attr.type);
    return fragment`${docPrefix}readonly ${attr.name}${optionalMark}: ${typeFragment};`;
}
