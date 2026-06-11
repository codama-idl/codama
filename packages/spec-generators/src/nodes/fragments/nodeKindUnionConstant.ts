/**
 * Render the top-level `REGISTERED_NODE_KINDS` registry: a runtime
 * `readonly string[]` listing every node kind in the spec, composed by
 * spreading each `Registered<Category>Node` kinds array plus the bare
 * kind of every node not already covered by one of those unions.
 */

import { type Fragment, fragment, mergeFragments, use } from '@codama/fragments/javascript';
import type { Spec } from '@codama/spec';

import { flattenNodeUnion, getRegisteredCategoryUnions } from '../../shared';
import { kindsArrayConstantName } from '../kindsArrayConstantName';

export function getNodeKindUnionConstantFragment(spec: Spec): Fragment {
    const registeredUnions = getRegisteredCategoryUnions(spec);

    const coveredKinds = new Set<string>(registeredUnions.flatMap(u => flattenNodeUnion(u, spec).map(n => n.kind)));

    const spreadLines = registeredUnions.map(
        u => fragment`...${use(kindsArrayConstantName(u.name), `kinds:${u.name}`)},`,
    );

    const bareKinds = spec.categories
        .flatMap(c => c.nodes)
        .map(node => node.kind)
        .filter(kind => !coveredKinds.has(kind))
        .sort();
    const bareLines = bareKinds.map(k => fragment`'${k}' as const,`);

    const body = mergeFragments([...bareLines, ...spreadLines], parts => parts.join('\n'));
    return fragment`// Node Registration.\nexport const REGISTERED_NODE_KINDS = [\n${body}\n];\n`;
}
