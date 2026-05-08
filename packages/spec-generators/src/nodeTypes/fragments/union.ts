import {
    type Fragment,
    fragment,
    getDocblockFragment,
    mergeFragments,
    pascalCase,
    use,
} from '@codama/fragments/javascript';
import type { UnionMember, UnionSpec } from '@codama/spec';

export function getUnionFragment(union: UnionSpec): Fragment {
    const memberFragments = sortMembers(union.members).map(getMemberFragment);
    const docComment = getDocblockFragment(union.docs, { withLineJump: true });
    const body = mergeFragments(memberFragments, parts => parts.map(p => `| ${p}`).join('\n'));
    return fragment`${docComment}export type ${pascalCase(union.name)} =\n${body};`;
}

function getMemberFragment(member: UnionMember): Fragment {
    if (member.kind === 'node') {
        return use(`type ${pascalCase(member.name)}`, `node:${member.name}`);
    }
    return use(`type ${pascalCase(member.name)}`, `union:${member.name}`);
}

function sortMembers(members: readonly UnionMember[]): readonly UnionMember[] {
    return [...members].sort((a, b) => pascalCase(a.name).localeCompare(pascalCase(b.name)));
}
