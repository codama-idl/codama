import { type Fragment, fragment, mergeFragments, use } from '@codama/fragments/javascript';
import type { Spec, UnionSpec } from '@codama/spec';

import { type ResolvedRenderOptions } from '../options';

/**
 * Render the kind-list expression for a `union('<Name>')` reference.
 *
 * If `<Name>` is listed in `options.unionAliasNames`, the result is a
 * `use(<alias>, '@codama/nodes')` fragment — emitting `<alias>` in
 * the generated body. Otherwise the union is expanded inline: each
 * member leaf kind becomes a `'kind'` literal, and any nested
 * `union('X')` member is rendered as a `...spread` of `X`'s alias
 * (the nested union must itself have an alias entry).
 *
 * Returns the bare expression — e.g. `TYPE_NODES`,
 * `['pdaLinkNode', 'pdaNode']`, or `[...VALUE_NODES, 'programIdValueNode']`.
 */
export function getUnionKindListFragment(
    unionName: string,
    spec: Spec,
    options: Pick<ResolvedRenderOptions, 'unionAliasNames'>,
): Fragment {
    const alias = options.unionAliasNames.get(unionName);
    if (alias !== undefined) {
        return use(alias, '@codama/nodes');
    }

    const union = findUnion(spec, unionName);
    if (!union) {
        throw new Error(`union "${unionName}" referenced from a child attribute is not declared in the spec.`);
    }

    return renderInlineUnionList(union, options);
}

/**
 * Render a union as an inline `[…]` literal — one entry per member.
 * `kind: 'node'` members become `'kind'` string literals; `kind:
 * 'union'` members become a `...spread` of the alias for the nested
 * union (which must be present in `options.unionAliasNames`).
 */
function renderInlineUnionList(union: UnionSpec, options: Pick<ResolvedRenderOptions, 'unionAliasNames'>): Fragment {
    const parts = union.members.map((member): Fragment => {
        if (member.kind === 'node') {
            return fragment`'${member.name}'`;
        }
        const alias = options.unionAliasNames.get(member.name);
        if (alias === undefined) {
            throw new Error(
                `union "${union.name}" contains a nested union "${member.name}" with no entry in unionAliasNames; ` +
                    `extend the table or flatten the union manually.`,
            );
        }
        const aliasFragment = use(alias, '@codama/nodes');
        return fragment`...${aliasFragment}`;
    });
    return mergeFragments(parts, ps => `[${ps.join(', ')}]`);
}

function findUnion(spec: Spec, name: string): UnionSpec | undefined {
    for (const category of spec.categories) {
        const found = category.unions.find(u => u.name === name);
        if (found) return found;
    }
    return undefined;
}
