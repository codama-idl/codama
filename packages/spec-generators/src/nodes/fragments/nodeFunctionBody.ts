import { type Fragment, fragment, mergeFragments, use } from '@codama/fragments/javascript';
import { type AttributeSpec, isChildAttribute, type NodeSpec } from '@codama/spec';

import type { AttributeOverride, NodeConstructorConfig } from '../config';
import { paramIdentifier } from '../paramIdentifier';
import { getNodeFunctionAttributeFragment } from './nodeFunctionAttribute';

/**
 * The node function body — a `return Object.freeze({ kind, ... });`
 * block, optionally preceded by a `const parsedDocs = parseDocs(...);`
 * hoist when the node has a `docs` attribute.
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
    let docsPreStatement: Fragment | undefined;

    for (const attr of node.attributes) {
        const isChild = isChildAttribute(attr.type);
        const override = config?.attributes?.[attr.name];
        const isBarePositional = isPositional && positionalSet.has(attr.name);
        const reader = computeReader(attr, override, isPositional, positionalSet);
        const typeParamAttr = typeParameterAttrsByName.get(attr.name);

        if (attr.type.kind === 'docs') {
            // Hoist `parseDocs(<reader>)` to a `parsedDocs` local so
            // we can both test its length and reuse the result. Named
            // `parsedDocs` rather than `docs` to avoid shadowing a
            // positional `docs` parameter.
            const parseDocsRef = use('parseDocs', 'shared:parseDocs');
            docsPreStatement = fragment`const parsedDocs = ${parseDocsRef}(${reader});`;
            dataLines.push(fragment`...(parsedDocs.length > 0 && { docs: parsedDocs }),`);
            continue;
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

    if (!docsPreStatement) return returnBlock;
    return fragment`${docsPreStatement}\n${returnBlock}`;
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
