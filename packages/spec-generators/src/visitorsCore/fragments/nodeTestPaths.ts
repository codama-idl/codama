import { type Fragment, fragment, joinPath, mergeFragments, pascalCase, use } from '@codama/fragments/javascript';
import type { Spec } from '@codama/spec';

import { type ResolvedRenderOptions } from '../options';

/**
 * Render the `generated/nodeTestPaths.ts` body — a map from each spec
 * node kind to the expected `test/nodes/` fixture path (no
 * `.test.ts` suffix, relative to `test/nodes/`).
 *
 * Path derivation mirrors the `@codama/nodes` generator: top-level
 * nodes land at the root (`AccountNode`), category-bucketed nodes go
 * under the matching folder (`typeNodes/ArrayTypeNode`). The same
 * `categoryDirectories` lookup feeds both.
 */
export function getNodeTestPathsFragment(spec: Spec, options: ResolvedRenderOptions): Fragment {
    const nodeKindType = use('type NodeKind', '@codama/nodes');
    const entries: Fragment[] = [];

    for (const category of spec.categories) {
        const folder = options.categoryDirectories.get(category.name);
        if (folder === undefined) {
            throw new Error(`unknown category "${category.name}". Extend categoryDirectories.`);
        }
        for (const node of category.nodes) {
            const path = folder === '' ? pascalCase(node.kind) : joinPath(folder, pascalCase(node.kind));
            entries.push(fragment`${node.kind}: '${path}',`);
        }
    }

    entries.sort((a, b) => a.content.localeCompare(b.content));
    const entriesBlock = mergeFragments(entries, ps => ps.join('\n'));

    return fragment`/**
 * The expected \`test/nodes/\` file path for each node kind, relative
 * to \`test/nodes/\` and without the \`.test.ts\` suffix. Used by the
 * per-node test fixture coverage gate.
 */
export const NODE_TEST_PATHS: Readonly<Record<${nodeKindType}, string>> = {
${entriesBlock}
};
`;
}
