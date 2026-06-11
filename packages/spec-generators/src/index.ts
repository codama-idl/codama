import { joinPath } from '@codama/fragments/javascript';
import { getSpec } from '@codama/spec';

import { generateNodes, NODE_CONFIGS } from './nodes';
import { generateNodeTypes } from './nodeTypes';
import { CATEGORY_DIRECTORIES, GENERIC_PARAM_ORDER, getRepoDirectory, NARROWABLE_DATA_ATTRIBUTES } from './shared';

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

    {
        const outputDir = joinPath(getRepoDirectory(), 'packages', 'nodes', 'src', 'generated');
        generateNodes(spec, {
            categoryDirectories: CATEGORY_DIRECTORIES,
            genericParamOrder: GENERIC_PARAM_ORDER,
            narrowableDataAttributes: NARROWABLE_DATA_ATTRIBUTES,
            nodeConfigs: NODE_CONFIGS,
            outputDir,
            targetSpecMajor: 1,
        });
        outputs.push({ generator: 'nodes', outputDir });
    }

    return { outputs };
}
