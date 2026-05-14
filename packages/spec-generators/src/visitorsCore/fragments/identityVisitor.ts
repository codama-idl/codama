import { type Fragment, fragment, mergeFragments, use } from '@codama/fragments/javascript';
import { isChildAttribute, type NodeSpec, type Spec } from '@codama/spec';

import { type NodeConstructorConfig } from '../../nodes';
import { type ResolvedRenderOptions } from '../options';
import { getVisitorFunctionName } from '../visitorFunctionName';
import { getIdentityWalkOrder } from '../walkStep';
import { getIdentityWalkStep } from './identityWalkStep';
import { getRebuildCallFragment } from './rebuildCall';

type IdentityScope = Pick<
    ResolvedRenderOptions,
    'identityVisitorWalkOrder' | 'mergeVisitorWalkOrder' | 'unionAliasNames'
>;

/**
 * Render the full `generated/identityVisitor.ts` body: the function
 * declaration plus one `if (keys.includes(<kind>)) { … }` block per
 * spec node that has at least one child attribute.
 *
 * Nodes with no child attributes are handled by `staticVisitor`'s
 * leaf function and don't appear in the dispatch table.
 */
export function getIdentityVisitorFragment(
    spec: Spec,
    nodeConfigs: ReadonlyMap<string, NodeConstructorConfig>,
    scope: IdentityScope,
): Fragment {
    const dispatchBranches = spec.categories
        .flatMap(c => c.nodes)
        .filter(node => node.attributes.some(attr => isChildAttribute(attr.type)))
        .map(node => getIdentityDispatchBranch(node, nodeConfigs.get(node.kind), spec, scope));

    const nodeType = use('type Node', '@codama/nodes');
    const nodeKindType = use('type NodeKind', '@codama/nodes');
    const registeredKinds = use('REGISTERED_NODE_KINDS', '@codama/nodes');
    const visitorType = use('type Visitor', 'helper:Visitor');
    const visit = use('visit as baseVisit', 'helper:visit');
    const staticVisitor = use('staticVisitor', 'helper:staticVisitor');

    const branchesBlock = mergeFragments(dispatchBranches, ps => ps.join('\n\n'));

    return fragment`/**
 * Identity visitor: rebuilds the tree node-by-node so callers can
 * intercept individual nodes via override hooks while leaving the
 * rest untouched. Returns \`null\` to drop a node (and its parents
 * that required it).
 */
export function identityVisitor<TNodeKind extends ${nodeKindType} = ${nodeKindType}>(
    options: { keys?: TNodeKind[] } = {},
): ${visitorType}<${nodeType} | null, TNodeKind> {
    const keys: ${nodeKindType}[] = options.keys ?? (${registeredKinds} as TNodeKind[]);
    const visitor = ${staticVisitor}(node => Object.freeze({ ...node }), { keys }) as ${visitorType}<${nodeType} | null>;
    const visit =
        (v: ${visitorType}<${nodeType} | null>) =>
        (node: ${nodeType}): ${nodeType} | null =>
            keys.includes(node.kind) ? ${visit}(node, v) : Object.freeze({ ...node });

    ${branchesBlock}

    return visitor as ${visitorType}<${nodeType}, TNodeKind>;
}
`;
}

function getIdentityDispatchBranch(
    node: NodeSpec,
    config: NodeConstructorConfig | undefined,
    spec: Spec,
    scope: IdentityScope,
): Fragment {
    const visitorFnName = getVisitorFunctionName(node.kind);
    // Compute one walk step per spec attribute. The rebuildExprs map
    // captures the per-attribute rebuild expression (data attrs →
    // bare `node.<name>`; children → either a local name or an
    // inline visit-and-filter chain).
    const stepByName = new Map<string, ReturnType<typeof getIdentityWalkStep>>();
    for (const attr of node.attributes) {
        stepByName.set(attr.name, getIdentityWalkStep(attr, config, spec, scope));
    }
    // Emit pre-statements in identity walk order. The identity
    // visitor's traversal sequence is observable from outside via
    // `recordNodeStackVisitor` + selector matching.
    const orderedChildren = getIdentityWalkOrder(node, scope);
    const preStatements = orderedChildren
        .map(attr => stepByName.get(attr.name)!.preStatement)
        .filter((p): p is Fragment => p !== undefined);
    const rebuildExprs = new Map<string, Fragment>();
    for (const attr of node.attributes) {
        rebuildExprs.set(attr.name, stepByName.get(attr.name)!.rebuildExpr);
    }
    const rebuildCall = getRebuildCallFragment(node, config, rebuildExprs, scope);
    const bodyBlock = mergeFragments([...preStatements, rebuildCall], ps => ps.join('\n'));

    return fragment`if (keys.includes('${node.kind}')) { visitor.${visitorFnName} = function ${visitorFnName}(node) { ${bodyBlock} }; }`;
}
