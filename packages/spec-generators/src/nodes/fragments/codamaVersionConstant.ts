import { type Fragment, fragment, getDocblockFragment, use } from '@codama/fragments/javascript';

import { toSpecVersion } from '../../shared';

/**
 * Build the file body for `generated/codamaVersion.ts` — the
 * `CODAMA_VERSION` constant pinned to the spec version at generation
 * time and typed as `CodamaVersion` from `@codama/node-types`.
 *
 * The constant names the *spec shape* an IDL conforms to, so any
 * pre-release/build metadata on the `@codama/spec` package version is
 * stripped (`2.0.0-rc.0` → `2.0.0`): a candidate rc implements the same
 * v2 spec shape as the eventual stable release.
 */
export function getCodamaVersionConstantFragment(specVersion: string): Fragment {
    const docblock = getDocblockFragment(
        [
            'The Codama spec version this package was generated against.',
            '',
            'Pinned to the spec version of `@codama/spec` at generation time',
            '(pre-release metadata stripped — this names the spec shape, not',
            'the npm package version). Used by `rootNode()` to tag the IDL and',
            "by downstream consumers that need to compare an IDL's `version`",
            'against the spec shape `@codama/nodes` understands.',
        ],
        { withLineJump: true },
    );
    const codamaVersionType = use('type CodamaVersion', '@codama/node-types');
    return fragment`${docblock}export const CODAMA_VERSION: ${codamaVersionType} = '${toSpecVersion(specVersion)}';\n`;
}
