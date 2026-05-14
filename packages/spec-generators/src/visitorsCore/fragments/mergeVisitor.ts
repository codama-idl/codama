import { type Fragment, fragment, mergeFragments, use } from '@codama/fragments/javascript';
import { isChildAttribute, type NodeSpec, type Spec } from '@codama/spec';

import { type ResolvedRenderOptions } from '../options';
import { getVisitorFunctionName } from '../visitorFunctionName';
import { getMergeWalkOrder } from '../walkStep';
import { getMergeCollectFragment } from './mergeCollect';

type MergeScope = Pick<ResolvedRenderOptions, 'mergeVisitorWalkOrder'>;

/**
 * Render the full `generated/mergeVisitor.ts` body: the function
 * declaration plus one `if (keys.includes(<kind>)) { … }` block per
 * spec node that has at least one child attribute.
 *
 * Nodes with no child attributes are handled by `staticVisitor`'s
 * leaf function (returning `leafValue(node)` directly) and don't
 * appear in the dispatch table.
 */
export function getMergeVisitorFragment(spec: Spec, scope: MergeScope): Fragment {
    const dispatchBranches = spec.categories
        .flatMap(c => c.nodes)
        .filter(node => node.attributes.some(attr => isChildAttribute(attr.type)))
        .map(node => getMergeDispatchBranch(node, scope));

    const nodeType = use('type Node', '@codama/nodes');
    const nodeKindType = use('type NodeKind', '@codama/nodes');
    const registeredKinds = use('REGISTERED_NODE_KINDS', '@codama/nodes');
    const visitorType = use('type Visitor', 'helper:Visitor');
    const visit = use('visit as baseVisit', 'helper:visit');
    const staticVisitor = use('staticVisitor', 'helper:staticVisitor');

    const branchesBlock = mergeFragments(dispatchBranches, ps => ps.join('\n\n'));

    return fragment`/**
 * Merge visitor: traverses the tree collecting per-node values into
 * a single result via a user-supplied \`merge\` function. Leaf nodes
 * (or nodes outside \`keys\`) yield \`leafValue(node)\`; every other
 * visited node's value is \`merge(node, [<visited children's values>])\`.
 */
export function mergeVisitor<TReturn, TNodeKind extends ${nodeKindType} = ${nodeKindType}>(
    leafValue: (node: ${nodeType}) => TReturn,
    merge: (node: ${nodeType}, values: TReturn[]) => TReturn,
    options: { keys?: TNodeKind[] } = {},
): ${visitorType}<TReturn, TNodeKind> {
    const keys: ${nodeKindType}[] = options.keys ?? ${registeredKinds};
    const visitor = ${staticVisitor}(leafValue, { keys }) as ${visitorType}<TReturn>;
    const visit =
        (v: ${visitorType}<TReturn>) =>
        (node: ${nodeType}): TReturn[] =>
            keys.includes(node.kind) ? [${visit}(node, v)] : [];

    ${branchesBlock}

    return visitor as ${visitorType}<TReturn, TNodeKind>;
}
`;
}

function getMergeDispatchBranch(node: NodeSpec, scope: MergeScope): Fragment {
    const visitorFnName = getVisitorFunctionName(node.kind);
    // Walk children in the merge-visitor walk order — observable
    // from outside via `getDebugStringVisitor`.
    const orderedChildren = getMergeWalkOrder(node, scope);
    const collectFragments = orderedChildren
        .map(attr => getMergeCollectFragment(attr))
        .filter((f): f is Fragment => f !== undefined);

    const mergeArg = renderMergeArgument(collectFragments);
    return fragment`if (keys.includes('${node.kind}')) { visitor.${visitorFnName} = function ${visitorFnName}(node) { return merge(node, ${mergeArg}); }; }`;
}

/**
 * Compose the second argument to `merge(node, …)`:
 *
 *   - Zero contributions → `[]`.
 *   - Exactly one contribution → drop the array wrapper and the
 *     leading `...` for readability.
 *   - Two or more → wrap them in an array literal.
 */
function renderMergeArgument(collectFragments: readonly Fragment[]): Fragment {
    if (collectFragments.length === 0) return fragment`[]`;
    if (collectFragments.length === 1) return stripLeadingSpread(collectFragments[0]);
    return fragment`[${mergeFragments(collectFragments, ps => ps.join(', '))}]`;
}

/**
 * Remove the leading `...` from a collect fragment so it can be
 * used as a bare expression (instead of inside an array literal).
 * The imports are preserved.
 */
function stripLeadingSpread(spread: Fragment): Fragment {
    if (!spread.content.startsWith('...')) return spread;
    return Object.freeze({
        ...spread,
        content: spread.content.slice(3),
    });
}
