import { type Fragment, mergeFragments, pascalCase, use } from '@codama/fragments/javascript';
import type { Spec } from '@codama/spec';

import { flattenNodeUnion, getRegisteredCategoryUnions } from '../../shared';

export function getNodeRegistryFragment(spec: Spec): Fragment {
    const registeredUnions = getRegisteredCategoryUnions(spec);

    const registeredUnionFragments = registeredUnions.map(u => use(`type ${pascalCase(u.name)}`, `union:${u.name}`));

    const registeredKinds = new Set(registeredUnions.flatMap(u => flattenNodeUnion(u, spec).map(n => n.kind)));

    const directNodeFragments = spec.categories
        .flatMap(c => c.nodes)
        .filter(node => !registeredKinds.has(node.kind))
        .map(node => use(`type ${pascalCase(node.kind)}`, `node:${node.kind}`));

    const sortedMembers = [...registeredUnionFragments, ...directNodeFragments].sort((a, b) =>
        a.content.localeCompare(b.content),
    );
    return mergeFragments(sortedMembers, contents => {
        const memberLines = contents.map(c => `| ${c}`).join('\n');
        return [
            '// Node Registration.',
            "export type NodeKind = Node['kind'];",
            'export type Node =',
            `${memberLines};`,
            '',
            '// Node Helpers.',
            'export type GetNodeFromKind<TKind extends NodeKind> = Extract<Node, { kind: TKind }>;',
        ].join('\n');
    });
}
