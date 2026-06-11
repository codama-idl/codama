/**
 * Render a runtime `*_KINDS` array from a spec union.
 *
 * Each leaf kind is tagged `as const` rather than the whole array, so
 * the resulting type is the convenient `('kindA' | 'kindB' | ...)[]`
 * shape — wider (mutable) than a `readonly [...]` tuple but compatible
 * with the legacy hand-written arrays' type and with the `isNode`
 * helpers' `kind: TKind | TKind[]` parameter. Composed unions spread
 * their members' arrays.
 */

import { type Fragment, fragment, getDocblockFragment, mergeFragments, use } from '@codama/fragments/javascript';
import type { UnionMember, UnionSpec } from '@codama/spec';

import { kindsArrayConstantName } from '../kindsArrayConstantName';

export function getKindUnionConstantFragment(union: UnionSpec): Fragment {
    const constantName = kindsArrayConstantName(union.name);
    const sortedMembers = sortMembers(union.members);
    const memberLines = sortedMembers.map(renderMember);

    const body = mergeFragments(memberLines, parts => parts.join('\n'));
    const docComment = getDocblockFragment(union.docs, { withLineJump: true });
    return fragment`${docComment}export const ${constantName} = [\n${body}\n];\n`;
}

function renderMember(member: UnionMember): Fragment {
    if (member.kind === 'node') {
        return fragment`'${member.name}' as const,`;
    }
    const constantName = kindsArrayConstantName(member.name);
    return fragment`...${use(constantName, `kinds:${member.name}`)},`;
}

function sortMembers(members: readonly UnionMember[]): readonly UnionMember[] {
    return [...members].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

function sortKey(member: UnionMember): string {
    return member.kind === 'node' ? member.name : kindsArrayConstantName(member.name);
}
