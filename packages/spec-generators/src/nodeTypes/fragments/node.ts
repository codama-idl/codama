import { type Fragment, fragment, getDocblockFragment, mergeFragments, pascalCase } from '@codama/fragments/javascript';
import { type AttributeSpec, isChildAttribute, type NodeSpec } from '@codama/spec';

import { isAttributeLifted } from '../options';
import type { RenderScope } from '../utils/scope';
import { isTypeExprSelfReferential } from '../utils/selfReference';
import { getAttributeBodyLineFragment } from './attributeBodyLine';
import { getKindLineFragment } from './kindLine';
import { getTypeParameterDefinitionFragment } from './typeParameterDefinition';

type NodeScope = Pick<RenderScope, 'genericParamOrder' | 'narrowableDataAttributes'>;

export function getNodeFragment(node: NodeSpec, scope: NodeScope): Fragment {
    const interfaceName = pascalCase(node.kind);
    // Self-referential nodes need an outside `type SelfFooNode = FooNode;`
    // alias: TS rejects a generic default that names the interface
    // being declared (e.g. `TX extends FooNode[] = FooNode[]` inside
    // `interface FooNode<TX>`).
    const isSelfReferential = node.attributes.some(
        attr => isChildAttribute(attr.type) && isTypeExprSelfReferential(attr.type, node.kind),
    );
    const selfAlias = isSelfReferential ? { alias: `Self${interfaceName}`, kind: node.kind } : undefined;

    const genericsBlock = getGenericsBlockFragment(
        orderLifted(node, scope).map(attr => getTypeParameterDefinitionFragment(attr, { selfAlias })),
    );

    const dataLines = node.attributes
        .filter(attr => !isChildAttribute(attr.type))
        .map(attr => getAttributeBodyLineFragment(node.kind, attr, scope));
    const childLines = node.attributes
        .filter(attr => isChildAttribute(attr.type))
        .map(attr => getAttributeBodyLineFragment(node.kind, attr, scope));

    const dataSection =
        dataLines.length > 0
            ? mergeFragments([fragment`// Data.`, ...dataLines], parts => parts.join('\n'))
            : undefined;
    const childSection =
        childLines.length > 0
            ? mergeFragments([fragment`// Children.`, ...childLines], parts => parts.join('\n'))
            : undefined;
    const body = mergeFragments([getKindLineFragment(node.kind), dataSection, childSection], parts =>
        parts.join('\n\n'),
    );

    const aliasPrefix = selfAlias ? fragment`type ${selfAlias.alias} = ${interfaceName};\n\n` : undefined;
    const docComment = getDocblockFragment(node.docs, { withLineJump: true });
    return fragment`${aliasPrefix}${docComment}export interface ${interfaceName}${genericsBlock} {\n${body}\n}`;
}

/**
 * Return the lifted attributes for `node` in their emission order. If
 * `scope.genericParamOrder` declares an override for this kind, it must
 * enumerate exactly the lifted set; mismatches throw rather than
 * silently drop generics.
 */
function orderLifted(node: NodeSpec, scope: NodeScope): readonly AttributeSpec[] {
    const lifted = node.attributes.filter(attr => isAttributeLifted(node.kind, attr, scope));
    const override = scope.genericParamOrder.get(node.kind);
    if (!override) return lifted;

    const byName = new Map(lifted.map(attr => [attr.name, attr]));
    const overrideSet = new Set(override);
    const liftedSet = new Set(byName.keys());
    const missingFromOverride = [...liftedSet].filter(n => !overrideSet.has(n));
    const unknownInOverride = override.filter(n => !liftedSet.has(n));
    if (missingFromOverride.length > 0 || unknownInOverride.length > 0) {
        const parts: string[] = [];
        if (missingFromOverride.length > 0) {
            parts.push(`missing lifted attribute(s) ${JSON.stringify(missingFromOverride)}`);
        }
        if (unknownInOverride.length > 0) {
            parts.push(`unknown attribute(s) ${JSON.stringify(unknownInOverride)}`);
        }
        throw new Error(
            `@codama/node-types generator: genericParamOrder for "${node.kind}" is out of sync with the spec: ${parts.join('; ')}.`,
        );
    }
    return override.map(name => byName.get(name)!);
}

function getGenericsBlockFragment(genericParams: readonly Fragment[]): Fragment {
    if (genericParams.length === 0) return fragment``;
    return mergeFragments(genericParams, parts => {
        const lines = parts.map(p => `${p},`).join('\n');
        return `<\n${lines}\n>`;
    });
}
