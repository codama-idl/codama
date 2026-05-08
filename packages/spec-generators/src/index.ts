import { joinPath } from '@codama/fragments/javascript';
import { getSpec } from '@codama/spec';

import { generateNodeTypes, GENERIC_PARAM_ORDER, NARROWABLE_DATA_ATTRIBUTES } from './nodeTypes';
import { getRepoDirectory } from './shared';

export interface GenerateResult {
    /** One entry per generator that ran, in the order they ran. */
    readonly outputs: readonly { readonly generator: string; readonly outputDir: string }[];
}

/**
 * Run every registered generator in turn. Each generator writes into a
 * dedicated output directory under the repo; the returned list records
 * where the freshly-generated files landed so the bin script can
 * report on the run.
 */
export function generate(): GenerateResult {
    const outputs: { generator: string; outputDir: string }[] = [];
    const spec = getSpec();

    {
        const outputDir = joinPath(getRepoDirectory(), 'packages', 'node-types', 'src', 'generated');
        generateNodeTypes(spec, {
            genericParamOrder: GENERIC_PARAM_ORDER,
            narrowableDataAttributes: NARROWABLE_DATA_ATTRIBUTES,
            outputDir,
            targetSpecMajor: 1,
        });
        outputs.push({ generator: 'nodeTypes', outputDir });
    }

    return { outputs };
}
