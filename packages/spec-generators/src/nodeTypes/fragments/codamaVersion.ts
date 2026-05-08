import { type Fragment, fragment, getDocblockFragment } from '@codama/fragments/javascript';

export function getCodamaVersionFragment(specVersion: string): Fragment {
    const docblock = getDocblockFragment(
        [
            'The Codama spec version this package describes. Pinned to the literal',
            'version of the spec at generation time; documents conforming to this',
            'version of the spec carry this exact string.',
        ],
        { withLineJump: true },
    );
    return fragment`${docblock}export type CodamaVersion = '${specVersion}';`;
}
