import { type Fragment, fragment, mergeFragments, use } from '@codama/fragments/javascript';
import type { Spec, UnionSpec } from '@codama/spec';

import { kindsArrayConstantName } from '../../nodes/kindsArrayConstantName';
import { type ResolvedRenderOptions } from '../options';

/**
 * Render the kind-list expression for a `union('<Name>')` reference.
 *
 * If `<Name>` is listed in `options.kindsConstantUnions`, the result
 * is a `use(<NAME>_KINDS, '@codama/nodes')` fragment, emitting the
 * union's generated kinds constant in the body. Otherwise the union is
 * expanded inline: each member leaf kind becomes a `'kind'` literal,
 * and any nested `union('X')` member is rendered as a `...spread` of
 * `X`'s kinds constant (the nested union must itself be listed).
 *
 * Returns the bare expression, e.g. `TYPE_NODE_KINDS`,
 * `['pdaLinkNode', 'pdaNode']`, or `[...VALUE_NODE_KINDS, 'programIdValueNode']`.
 */
export function getUnionKindListFragment(
    unionName: string,
    spec: Spec,
    options: Pick<ResolvedRenderOptions, 'kindsConstantUnions'>,
): Fragment {
    if (options.kindsConstantUnions.has(unionName)) {
        return use(kindsArrayConstantName(unionName), '@codama/nodes');
    }

    const union = findUnion(spec, unionName);
    if (!union) {
        throw new Error(`union "${unionName}" referenced from a child attribute is not declared in the spec.`);
    }

    return renderInlineUnionList(union, options);
}

/**
 * Render a union as an inline `[…]` literal, one entry per member.
 * `kind: 'node'` members become `'kind'` string literals; `kind:
 * 'union'` members become a `...spread` of the nested union's kinds
 * constant (the nested union must be in `options.kindsConstantUnions`).
 */
function renderInlineUnionList(
    union: UnionSpec,
    options: Pick<ResolvedRenderOptions, 'kindsConstantUnions'>,
): Fragment {
    const parts = union.members.map((member): Fragment => {
        if (member.kind === 'node') {
            return fragment`'${member.name}'`;
        }
        if (!options.kindsConstantUnions.has(member.name)) {
            throw new Error(
                `union "${union.name}" contains a nested union "${member.name}" with no entry in kindsConstantUnions; ` +
                    `extend the table or flatten the union manually.`,
            );
        }
        const kindsFragment = use(kindsArrayConstantName(member.name), '@codama/nodes');
        return fragment`...${kindsFragment}`;
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
