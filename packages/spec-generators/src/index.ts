import { joinPath } from '@codama/fragments/javascript';
import { getSpec } from '@codama/spec';
import { getSpec as getSpecV1 } from '@codama/spec-v1';

import { generateNodes, NODE_CONFIGS } from './nodes';
import { generateNodeTypes } from './nodeTypes';
import { CATEGORY_DIRECTORIES, GENERIC_PARAM_ORDER, getRepoDirectory, NARROWABLE_DATA_ATTRIBUTES } from './shared';
import {
    generateVisitorsCore,
    IDENTITY_VISITOR_WALK_ORDER,
    MERGE_VISITOR_WALK_ORDER,
    UNION_ALIAS_NAMES,
} from './visitorsCore';

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

    {
        const outputDir = joinPath(getRepoDirectory(), 'packages', 'visitors-core', 'src', 'generated');
        generateVisitorsCore(spec, {
            identityVisitorWalkOrder: IDENTITY_VISITOR_WALK_ORDER,
            mergeVisitorWalkOrder: MERGE_VISITOR_WALK_ORDER,
            outputDir,
            targetSpecMajor: 1,
            unionAliasNames: UNION_ALIAS_NAMES,
        });
        outputs.push({ generator: 'visitorsCore', outputDir });
    }

    // Freeze the v1 node types into `@codama/upgrade`. The frozen snapshot
    // is generated from its own aliased pin (`@codama/spec-v1`), so it only
    // changes when that pin — or the generator code — deliberately changes.
    // While the living `@codama/spec` pin is still on its 1.x line the two
    // specs coincide; after the v2 transition, the living pin moves to 2.x
    // and the alias keeps pointing at the last published 1.x.
    {
        const outputDir = joinPath(getRepoDirectory(), 'packages', 'upgrade', 'src', 'v1', 'generated');
        generateNodeTypes(getSpecV1(), {
            genericParamOrder: GENERIC_PARAM_ORDER,
            narrowableDataAttributes: NARROWABLE_DATA_ATTRIBUTES,
            outputDir,
            targetSpecMajor: 1,
        });
        outputs.push({ generator: 'nodeTypes@v1-frozen', outputDir });
    }

    return { outputs };
}
