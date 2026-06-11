import { type Fragment, fragment, getDocblockFragment, use } from '@codama/fragments/javascript';

/**
 * Build the file body for `generated/codamaVersion.ts` — the
 * `CODAMA_VERSION` constant pinned to the spec version at generation
 * time and typed as `CodamaVersion` from `@codama/node-types`.
 */
export function getCodamaVersionConstantFragment(specVersion: string): Fragment {
    const docblock = getDocblockFragment(
        [
            'The Codama spec version this package was generated against.',
            '',
            'Pinned to the literal version of `@codama/spec` at generation time.',
            'Used by `rootNode()` to tag the document and by downstream consumers',
            "that need to compare an IDL document's `version` against the spec",
            'shape `@codama/nodes` understands.',
        ],
        { withLineJump: true },
    );
    const codamaVersionType = use('type CodamaVersion', '@codama/node-types');
    return fragment`${docblock}export const CODAMA_VERSION: ${codamaVersionType} = '${specVersion}';\n`;
}
