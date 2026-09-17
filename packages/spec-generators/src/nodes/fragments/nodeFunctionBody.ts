import { type Fragment, fragment, mergeFragments } from '@codama/fragments/javascript';
import { type AttributeSpec, isChildAttribute, type NodeSpec } from '@codama/spec';

import type { AttributeOverride, NodeConstructorConfig } from '../config';
import { paramIdentifier } from '../paramIdentifier';
import { getNodeFunctionAttributeFragment } from './nodeFunctionAttribute';

/** True when `override` carries a `coerce` body expression. */
function hasCoerce(override: AttributeOverride | undefined): boolean {
    return override !== undefined && 'coerce' in override;
}

/**
 * The node function body — a `return Object.freeze({ kind, ... });`
 * block. `docs` and `text` attributes are ordinary `string | textNode`
 * children with no bespoke handling: pass-through when required,
 * conditional spread when optional, like every other child.
 */
export function getNodeFunctionBodyFragment(
    node: NodeSpec,
    config: NodeConstructorConfig | undefined,
    typeParameterAttributes: readonly AttributeSpec[],
): Fragment {
    const isPositional = config?.positionalArgs !== undefined;
    const positionalSet = new Set(config?.positionalArgs ?? []);
    const typeParameterAttrsByName = new Map(typeParameterAttributes.map(attr => [attr.name, attr]));

    const dataLines: Fragment[] = [];
    const childLines: Fragment[] = [];
    const preStatements: Fragment[] = [];

    for (const attr of node.attributes) {
        const isChild = isChildAttribute(attr.type);
        const override = config?.attributes?.[attr.name];
        const isBarePositional = isPositional && positionalSet.has(attr.name);
        let reader = computeReader(attr, override, isPositional, positionalSet);
        const typeParamAttr = typeParameterAttrsByName.get(attr.name);

        // A `coerce` override's body expression is authored against the
        // attribute's bare param name (e.g. `typeof program === 'string'
        // ? …`). When the attribute isn't a bare positional its reader is
        // `options.<name>` / `input.<name>`, so bind that to the expected
        // local name first, then read from the local.
        if (hasCoerce(override) && !isBarePositional) {
            const local = paramIdentifier(attr, override);
            preStatements.push(fragment`const ${local} = ${reader};`);
            reader = local;
        }

        const line = getNodeFunctionAttributeFragment(attr, reader, override, typeParamAttr, isBarePositional);
        (isChild ? childLines : dataLines).push(line);
    }

    const kindLine = fragment`kind: '${node.kind}',`;
    const sectionFragments: Fragment[] = [kindLine];
    if (dataLines.length > 0) {
        sectionFragments.push(fragment``, fragment`// Data.`, ...dataLines);
    }
    if (childLines.length > 0) {
        sectionFragments.push(fragment``, fragment`// Children.`, ...childLines);
    }

    const objectLiteral = mergeFragments(sectionFragments, parts => parts.join('\n'));
    const returnBlock = fragment`return Object.freeze({\n${objectLiteral}\n});`;
    if (preStatements.length === 0) return returnBlock;
    const preBlock = mergeFragments(preStatements, parts => parts.join('\n'));
    return fragment`${preBlock}\n${returnBlock}`;
}

/**
 * How the body refers to one attribute's incoming value:
 *
 *   - Object-input          → `input.<attrName>`
 *   - Positional bare arg   → `<paramName>` (the JS identifier)
 *   - Positional bag arg    → `options.<attrName>`
 */
function computeReader(
    attr: AttributeSpec,
    override: AttributeOverride | undefined,
    isPositional: boolean,
    positionalSet: ReadonlySet<string>,
): string {
    if (!isPositional) return `input.${attr.name}`;
    if (positionalSet.has(attr.name)) return paramIdentifier(attr, override);
    return `options.${attr.name}`;
}
