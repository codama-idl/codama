import type { NodeSpec, Spec, UnionSpec } from '@codama/spec';

/**
 * Any union whose name starts with `Registered` is a category-registry
 * union (e.g. `RegisteredContextualValueNode`). Derived from the spec
 * so future categories are picked up automatically.
 */
const REGISTERED_CATEGORY_UNION_PREFIX = 'Registered';

/**
 * Return the spec's per-category registry unions (those whose names
 * start with `Registered`), sorted alphabetically by name.
 */
export function getRegisteredCategoryUnions(spec: Spec): readonly UnionSpec[] {
    return spec.categories
        .flatMap(c => c.unions)
        .filter(u => u.name.startsWith(REGISTERED_CATEGORY_UNION_PREFIX))
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Return the leaf nodes reachable from `union` by walking through
 * nested `{ kind: 'union' }` members recursively. `nestedUnion`
 * members are not followed — they are name-aliased and break the
 * cycle on the TS side. Unknown member references are skipped
 * silently; the spec validator catches those upstream.
 */
export function flattenNodeUnion(union: UnionSpec, spec: Spec): readonly NodeSpec[] {
    const unionByName = new Map(spec.categories.flatMap(c => c.unions).map(u => [u.name, u]));
    const nodeByKind = new Map(spec.categories.flatMap(c => c.nodes).map(n => [n.kind, n]));
    const out: NodeSpec[] = [];
    const visited = new Set<string>();
    const stack: string[] = [union.name];
    while (stack.length > 0) {
        const name = stack.pop()!;
        if (visited.has(name)) continue;
        visited.add(name);
        const u = unionByName.get(name);
        if (!u) continue;
        for (const m of u.members) {
            if (m.kind === 'node') {
                const node = nodeByKind.get(m.name);
                if (node) out.push(node);
            } else if (m.kind === 'union') {
                stack.push(m.name);
            }
        }
    }
    return out;
}
