import { type Fragment, fragment, getDocblockFragment, mergeFragments, pascalCase } from '@codama/fragments/javascript';
import { isChildAttribute, type NodeSpec } from '@codama/spec';

import { getNodeTypeParameterAttributes, type RenderScope } from '../options';
import { isTypeExprSelfReferential } from '../selfReference';
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
        getNodeTypeParameterAttributes(node, scope).map(attr =>
            getTypeParameterDefinitionFragment(attr, { selfAlias }),
        ),
    );

    // Attributes follow the spec's declaration order, base attributes last, which is the order they serialise in.
    const attributeLines = node.attributes.map(attr => getAttributeBodyLineFragment(node.kind, attr, scope));
    const attributeSection =
        attributeLines.length > 0 ? mergeFragments(attributeLines, parts => parts.join('\n')) : undefined;
    const body = mergeFragments([getKindLineFragment(node.kind), attributeSection], parts => parts.join('\n\n'));

    const aliasPrefix = selfAlias ? fragment`type ${selfAlias.alias} = ${interfaceName};\n\n` : undefined;
    const docComment = getDocblockFragment(node.docs, { withLineJump: true });
    return fragment`${aliasPrefix}${docComment}export interface ${interfaceName}${genericsBlock} {\n${body}\n}`;
}

function getGenericsBlockFragment(genericParams: readonly Fragment[]): Fragment {
    if (genericParams.length === 0) return fragment``;
    return mergeFragments(genericParams, parts => {
        const lines = parts.map(p => `${p},`).join('\n');
        return `<\n${lines}\n>`;
    });
}
