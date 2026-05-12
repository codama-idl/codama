import { type Fragment, fragment, mergeFragments, use } from '@codama/fragments/javascript';
import type { AttributeSpec, NodeSpec } from '@codama/spec';

import { getTypeParameterIdentifierFragment } from '../../shared';
import type { AttributeOverride, NodeConstructorConfig } from '../config';
import { isStringIdentifierAttr, paramIdentifier } from '../paramIdentifier';
import { getNodeTypeParameterConstraint } from './nodeTypeParameters';
import { getTypeExprFragment } from './typeExpr';

/**
 * The node function's positional-argument list plus a trailing
 * `options` bag for every attribute not listed in `positionalArgs`.
 * `hidden`-defaulted attributes are excluded from both — they're
 * emitted directly in the body. Returned fragment has no leading or
 * trailing whitespace; the caller composes it into a larger fragment.
 */
export function getNodeFunctionPositionalArgumentsFragment(
    node: NodeSpec,
    typeParameterAttributes: readonly AttributeSpec[],
    config: NodeConstructorConfig,
): Fragment {
    const positionalNames = config.positionalArgs ?? [];
    const typeParameterAttrsByName = new Map(typeParameterAttributes.map(attr => [attr.name, attr]));

    const bareParams = positionalNames.map(name => {
        const attr = findAttr(node, name);
        return renderParamForAttribute(attr, typeParameterAttrsByName.get(name), config);
    });

    const bagAttrs = node.attributes.filter(a => {
        if (positionalNames.includes(a.name)) return false;
        const override = config.attributes?.[a.name];
        if (override && 'default' in override && override.hidden) return false;
        return true;
    });
    if (bagAttrs.length > 0) {
        const bagFields = bagAttrs.map(a => renderBagField(a, typeParameterAttrsByName.get(a.name)));
        const fieldLines = mergeFragments(bagFields, parts => parts.map(p => `${p};`).join('\n'));
        const bagType = fragment`{\n${fieldLines}\n}`;
        bareParams.push(fragment`options: ${bagType} = {}`);
    }

    if (bareParams.length === 0) return fragment``;
    if (bareParams.length === 1) return bareParams[0];
    return mergeFragments(bareParams, parts => parts.map(p => `${p},`).join('\n'));
}

function findAttr(node: NodeSpec, name: string): AttributeSpec {
    const attr = node.attributes.find(a => a.name === name);
    if (!attr) {
        throw new Error(`spec node "${node.kind}" has no attribute "${name}".`);
    }
    return attr;
}

function renderParamForAttribute(
    attr: AttributeSpec,
    typeParameterAttribute: AttributeSpec | undefined,
    config: NodeConstructorConfig,
): Fragment {
    const override = config.attributes?.[attr.name];
    const paramName = paramIdentifier(attr, override);
    const baseTsType = renderParamTsType(attr, typeParameterAttribute, override);
    const optionalMark = attr.optional ? '?' : '';
    const defaultClause = renderParamDefaultClause(override, typeParameterAttribute);
    return fragment`${paramName}${optionalMark}: ${baseTsType}${defaultClause}`;
}

function renderBagField(attr: AttributeSpec, typeParameterAttribute: AttributeSpec | undefined): Fragment {
    return fragment`${attr.name}?: ${renderAttributeTsType(attr, typeParameterAttribute)}`;
}

function renderParamTsType(
    attr: AttributeSpec,
    typeParameterAttribute: AttributeSpec | undefined,
    override: AttributeOverride | undefined,
): Fragment {
    const base = renderAttributeTsType(attr, typeParameterAttribute);
    return override && 'coerce' in override ? fragment`${base} | string` : base;
}

/**
 * The TS type expression for one attribute in the node function's
 * positional-parameter signature or bag-field type. Type-parameter
 * attributes render as their generic identifier; `docs` widens to
 * `DocsInput`; `stringIdentifier()`-typed attributes widen to plain
 * `string`. Everything else falls through to the spec type.
 */
function renderAttributeTsType(attr: AttributeSpec, typeParameterAttribute: AttributeSpec | undefined): Fragment {
    if (typeParameterAttribute) return fragment`${getTypeParameterIdentifierFragment(typeParameterAttribute)}`;
    if (attr.type.kind === 'docs') return use('DocsInput', 'shared:DocsInput');
    if (isStringIdentifierAttr(attr)) return fragment`string`;
    return getTypeExprFragment(attr.type);
}

function renderParamDefaultClause(
    override: AttributeOverride | undefined,
    typeParameterAttribute: AttributeSpec | undefined,
): Fragment {
    if (!override || !('default' in override)) return fragment``;
    // For type-parameter attributes, cast the value-level default
    // through to the generic so the caller can still narrow. The
    // intermediate cast (e.g. `as ProgramNode[]` for an `[]` default
    // on a `ProgramNode[]` attribute) widens the literal expression
    // before the final narrowing — matches the existing hand-written
    // pattern `[] as ProgramNode[] as TAdditionalPrograms`.
    if (typeParameterAttribute) {
        const genericName = getTypeParameterIdentifierFragment(typeParameterAttribute);
        const intermediate = override.genericDefault ?? getNodeTypeParameterConstraint(typeParameterAttribute);
        const needsIntermediate = intermediate.content !== override.default.content;
        const castChain = needsIntermediate
            ? fragment`${override.default} as ${intermediate} as ${genericName}`
            : fragment`${override.default} as ${genericName}`;
        return fragment` = ${castChain}`;
    }
    return fragment` = ${override.default}`;
}
