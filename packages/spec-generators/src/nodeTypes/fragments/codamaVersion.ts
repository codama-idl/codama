import { type Fragment, fragment, getDocblockFragment } from '@codama/fragments/javascript';

export function getCodamaVersionFragment(specVersion: string): Fragment {
    const major = parseMajor(specVersion);
    const docblock = getDocblockFragment(
        [
            'The shape of Codama spec versions this package describes. Pinned to the',
            'spec major at generation time; IDLs conforming to any minor or patch',
            'of that major carry a string of this shape.',
        ],
        { withLineJump: true },
    );
    return fragment`${docblock}export type CodamaVersion = \`${major}.\${number}.\${number}\`;`;
}

function parseMajor(specVersion: string): number {
    const match = specVersion.match(/^(\d+)\./);
    if (!match) throw new Error(`Cannot parse a major version from spec version "${specVersion}".`);
    return Number(match[1]);
}
