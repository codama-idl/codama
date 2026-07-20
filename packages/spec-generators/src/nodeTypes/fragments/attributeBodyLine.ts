import { type Fragment, fragment, getDocblockFragment } from '@codama/fragments/javascript';
import type { AttributeSpec } from '@codama/spec';

import { getTypeParameterIdentifierFragment } from '../../shared';
import { isNodeTypeParameterAttribute, type RenderScope } from '../options';
import { getTypeExprFragment } from './typeExpr';

/**
 * Render one attribute as a body line inside an interface declaration.
 * Type-parameter attributes use their type-parameter identifier (e.g.
 * `readonly data: TData;`); other attributes use the rendered type
 * expression. Optional attributes — and every array attribute,
 * regardless of `optional` — carry a `?:` marker; `docs` (if any)
 * become a JSDoc prefix.
 *
 * Arrays are always optional on the type because they skip-when-empty:
 * an empty array is omitted from the node, so a reader may always find
 * the attribute absent (see the "Array attributes are omitted when
 * empty" convention in the `@codama/spec` README).
 */
export function getAttributeBodyLineFragment(
    nodeKind: string,
    attr: AttributeSpec,
    scope: Pick<RenderScope, 'narrowableDataAttributes'>,
): Fragment {
    const docPrefix = getDocblockFragment(attr.docs, { withLineJump: true });
    const optionalMark = attr.optional === true || attr.type.kind === 'array' ? '?' : '';
    const typeFragment = isNodeTypeParameterAttribute(nodeKind, attr, scope)
        ? getTypeParameterIdentifierFragment(attr)
        : getTypeExprFragment(attr.type);
    return fragment`${docPrefix}readonly ${attr.name}${optionalMark}: ${typeFragment};`;
}
