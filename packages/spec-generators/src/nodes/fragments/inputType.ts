/**
 * Render the `XxxNodeInput` type declaration for an object-input node
 * function.
 *
 * The Input type takes the same type parameters as the node function
 * (with the "wide" defaults: each type parameter defaults to its own
 * constraint) and relaxes the strict shape of the matching node
 * interface so callers can pass `name: string` instead of the branded
 * `CamelCaseString`, `docs?: DocsInput` instead of `Docs`, and omit any
 * attribute the node function defaults (via a `Partial<>` wrap when
 * present).
 */

import { type Fragment, fragment, mergeFragments, use } from '@codama/fragments/javascript';
import type { AttributeSpec, NodeSpec } from '@codama/spec';

import { getTypeParameterIdentifierFragment, getTypeParameterIdentifierListFragment } from '../../shared';
import type { NodeConstructorConfig } from '../config';
import { getNodeTypeParameterConstraint } from './nodeTypeParameters';

export function getInputTypeFragment(
    node: NodeSpec,
    interfaceName: string,
    config: NodeConstructorConfig | undefined,
    typeParameterAttributes: readonly AttributeSpec[],
): Fragment {
    const inputName = `${interfaceName}Input`;
    const typeParametersBlock = getInputTypeParametersFragment(typeParameterAttributes);

    const reassertedFields = collectReassertedFields(node);
    const omittedFromBase = collectOmittedFields(reassertedFields);

    const hasDefaults = nodeHasDefaultedRequiredAttribute(node, config);
    const baseTypeRef = use(`type ${interfaceName}`, '@codama/node-types');
    const baseWithGenerics = renderBaseWithGenerics(baseTypeRef, typeParameterAttributes);
    const omitClause = `'${omittedFromBase.join("' | '")}'`;
    const baseClause = hasDefaults
        ? fragment`Omit<Partial<${baseWithGenerics}>, ${omitClause}>`
        : fragment`Omit<${baseWithGenerics}, ${omitClause}>`;

    if (reassertedFields.length === 0) {
        return fragment`export type ${inputName}${typeParametersBlock} = ${baseClause};\n`;
    }
    const intersectionLines = reassertedFields.map(f => fragment`readonly ${f.name}: ${f.tsType};`);
    const intersectionBlock = mergeFragments(intersectionLines, parts => parts.join('\n'));
    return fragment`export type ${inputName}${typeParametersBlock} = ${baseClause} & {\n${intersectionBlock}\n};\n`;
}

/**
 * The `<TA extends ConstraintA = ConstraintA, …>` type-parameter block
 * on a `XxxNodeInput` type. Each parameter uses the "wide" default —
 * its own constraint — so callers who don't narrow get a usable Input
 * type.
 */
function getInputTypeParametersFragment(typeParameterAttributes: readonly AttributeSpec[]): Fragment {
    if (typeParameterAttributes.length === 0) return fragment``;
    const parts = typeParameterAttributes.map(attr => {
        const constraint = getNodeTypeParameterConstraint(attr);
        return fragment`${getTypeParameterIdentifierFragment(attr.name)} extends ${constraint} = ${constraint}`;
    });
    const joined = mergeFragments(parts, ps => ps.join(',\n'));
    return fragment`<\n${joined}\n>`;
}

/**
 * `true` if the node has a spec-required attribute that the node
 * function defaults via an override. The Input type then wraps the
 * base interface in `Partial<>` so callers can omit those fields.
 */
function nodeHasDefaultedRequiredAttribute(node: NodeSpec, config: NodeConstructorConfig | undefined): boolean {
    const attributes = config?.attributes;
    if (!attributes) return false;
    return node.attributes.some(attr => {
        if (attr.optional === true) return false;
        const override = attributes[attr.name];
        return override !== undefined && 'default' in override;
    });
}

/**
 * Fields the Input type re-asserts in the intersection block:
 *
 *   - Every `stringIdentifier()`-typed attribute relaxes from the branded
 *     `CamelCaseString` to plain `string` (the constructor body runs
 *     `camelCase(...)` on the value). This covers `name` and any other
 *     identifier-shaped attribute (e.g. `accountFieldValueNode.account`,
 *     `injectedValueNode.key`).
 *   - `docs?: DocsInput` (relaxed from `Docs`).
 *   - `publicKey: ProgramNode['publicKey']` for `programNode` — a
 *     required-not-defaulted field that survives the `Partial<>` wrap.
 */
function collectReassertedFields(node: NodeSpec): readonly { readonly name: string; readonly tsType: Fragment }[] {
    const out: { name: string; tsType: Fragment }[] = [];
    for (const attr of node.attributes) {
        if (attr.type.kind === 'string' && attr.type.constraint === 'identifier') {
            const fieldName = attr.optional ? `${attr.name}?` : attr.name;
            out.push({ name: fieldName, tsType: fragment`string` });
        }
    }
    if (node.attributes.some(a => a.name === 'docs')) {
        const docsInput = use('DocsInput', 'shared:DocsInput');
        out.push({ name: 'docs?', tsType: fragment`${docsInput}` });
    }
    if (node.kind === 'programNode') {
        out.push({ name: 'publicKey', tsType: fragment`ProgramNode['publicKey']` });
    }
    return out;
}

function collectOmittedFields(reassertedFields: readonly { readonly name: string }[]): readonly string[] {
    const set = new Set<string>(['kind']);
    for (const f of reassertedFields) set.add(f.name.replace(/\?$/, ''));
    return [...set].sort();
}

function renderBaseWithGenerics(baseRef: Fragment, typeParameterAttributes: readonly AttributeSpec[]): Fragment {
    if (typeParameterAttributes.length === 0) return baseRef;
    const names = getTypeParameterIdentifierListFragment(typeParameterAttributes);
    return fragment`${baseRef}<${names}>`;
}
