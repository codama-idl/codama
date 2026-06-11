import { type Fragment, fragment } from '@codama/fragments/javascript';
import { type AttributeSpec, type NodeSpec } from '@codama/spec';

import { type AttributeOverride, type NodeConstructorConfig } from '../config';
import { type ResolvedRenderOptions } from '../options';
import { getTypeExprFragment } from './typeExpr';

/**
 * The constraint Fragment for the type parameter derived from `attr`.
 * Optional attributes get `| undefined` appended; required attributes
 * use the bare type expression.
 */
export function getNodeTypeParameterConstraint(attr: AttributeSpec): Fragment {
    const baseType = getTypeExprFragment(attr.type);
    return attr.optional === true ? fragment`${baseType} | undefined` : baseType;
}

/**
 * Compute the node function's per-type-parameter default expressions
 * in lockstep with the type-parameter-attribute list's output order.
 * Returns an empty fragment for required type parameters with no
 * default.
 *
 * As a final pass, any required-no-default type parameter that follows
 * a defaulted one is broadened to its wide constraint — TS requires
 * required type parameters to appear before defaulted ones.
 */
export function computeConstructorDefaults(
    node: NodeSpec,
    typeParameterAttributes: readonly AttributeSpec[],
    config: NodeConstructorConfig | undefined,
    scope: Pick<ResolvedRenderOptions, 'narrowableDataAttributes'>,
): readonly Fragment[] {
    const raw = typeParameterAttributes.map(attr => {
        const override = config?.attributes?.[attr.name];
        return computeConstructorDefault(node.kind, attr, override, getTypeExprFragment(attr.type), scope);
    });
    return broadenTrailingRequiredTypeParameters(raw, typeParameterAttributes);
}

function broadenTrailingRequiredTypeParameters(
    defaults: readonly Fragment[],
    typeParameterAttributes: readonly AttributeSpec[],
): readonly Fragment[] {
    let seenDefaulted = false;
    return defaults.map((d, i) => {
        if (d.content) {
            seenDefaulted = true;
            return d;
        }
        if (seenDefaulted) {
            return getNodeTypeParameterConstraint(typeParameterAttributes[i]);
        }
        return d;
    });
}

function computeConstructorDefault(
    nodeKind: string,
    attr: AttributeSpec,
    override: AttributeOverride | undefined,
    baseType: Fragment,
    scope: Pick<ResolvedRenderOptions, 'narrowableDataAttributes'>,
): Fragment {
    if (override && 'default' in override) {
        return override.genericDefault ?? override.default;
    }
    if (attr.optional === true) {
        return fragment`undefined`;
    }
    if (override && 'coerce' in override) {
        return baseType;
    }
    if (scope.narrowableDataAttributes.has(`${nodeKind}:${attr.name}`)) {
        return baseType;
    }
    return fragment``;
}
