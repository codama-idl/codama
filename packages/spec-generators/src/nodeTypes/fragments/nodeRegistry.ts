import { type Fragment, mergeFragments, pascalCase, use } from '@codama/fragments/javascript';
import type { Spec, UnionMember } from '@codama/spec';

const REGISTERED_CATEGORY_UNIONS: readonly string[] = [
    'RegisteredContextualValueNode',
    'RegisteredCountNode',
    'RegisteredDiscriminatorNode',
    'RegisteredLinkNode',
    'RegisteredPdaSeedNode',
    'RegisteredTypeNode',
    'RegisteredValueNode',
];

type UnionLookup = ReadonlyMap<string, { readonly members: readonly UnionMember[] }>;

export function getNodeRegistryFragment(spec: Spec): Fragment {
    const unionByName: UnionLookup = new Map(spec.categories.flatMap(c => c.unions).map(u => [u.name, u]));

    const registeredUnionFragments = REGISTERED_CATEGORY_UNIONS.map(unionName => {
        if (!unionByName.has(unionName)) {
            throw new Error(
                `@codama/node-types generator: missing union "${unionName}" expected by REGISTERED_CATEGORY_UNIONS. ` +
                    `Either the spec dropped this category-registry union or REGISTERED_CATEGORY_UNIONS is out of date.`,
            );
        }
        return use(`type ${pascalCase(unionName)}`, `union:${unionName}`);
    });

    const registeredKinds = new Set(
        REGISTERED_CATEGORY_UNIONS.flatMap(unionName => [...collectKindsFromUnion(unionByName, unionName)]),
    );

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

/**
 * Recursively expand `union` references in a union's member list into
 * their own members, leaving only direct `node` / `nestedUnion`
 * members. Used to walk the registry-union → sub-union → node graph.
 */
function flattenUnionMembers(
    unionByName: UnionLookup,
    unionName: string,
    visited: Set<string> = new Set(),
): readonly UnionMember[] {
    if (visited.has(unionName)) return [];
    visited.add(unionName);
    const union = unionByName.get(unionName);
    if (!union) return [];
    return union.members.flatMap(m => (m.kind === 'union' ? flattenUnionMembers(unionByName, m.name, visited) : [m]));
}

/** The set of node kinds reachable from a union (recursively through sub-unions). */
function collectKindsFromUnion(unionByName: UnionLookup, unionName: string): ReadonlySet<string> {
    return new Set(
        flattenUnionMembers(unionByName, unionName)
            .filter(m => m.kind === 'node')
            .map(m => m.name),
    );
}
