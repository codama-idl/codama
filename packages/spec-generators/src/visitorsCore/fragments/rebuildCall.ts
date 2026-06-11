import { type Fragment, fragment, mergeFragments, use } from '@codama/fragments/javascript';
import { type AttributeSpec, isChildAttribute, type NodeSpec } from '@codama/spec';

import { type NodeConstructorConfig } from '../../nodes';
import { type ResolvedRenderOptions } from '../options';
import { getIdentityWalkOrder } from '../walkStep';

/**
 * Render the constructor call that rebuilds a node at the end of an
 * identity-visitor body.
 *
 * The shape depends on `config.positionalArgs`:
 *
 *   - **Object-input form** (no `positionalArgs`):
 *     `return <kind>({ ...node, <visitedChild1>: <expr1>, … });`
 *     Only visited (child) attributes are listed explicitly; data
 *     attributes flow through the `...node` spread.
 *
 *   - **Pure-positional form** (every spec attribute either appears in
 *     `positionalArgs` or is a `hidden` default):
 *     `return <kind>(<arg1>, <arg2>, …);`
 *     Each positional argument is either the visited rebuild expression
 *     (when the attribute is a child reference) or `node.<name>` (for
 *     data).
 *
 *   - **Hybrid form** (some positional args + remaining attributes):
 *     `return <kind>(<positional1>, <positional2>, …, { ...node, <visitedChildN>: <exprN>, … });`
 *     Positionals as above; remaining attributes ride along in an
 *     options bag whose `{ ...node }` spread carries through any data
 *     fields the visitor doesn't touch.
 *
 * The mapping from attribute → rebuild expression is supplied via
 * `rebuildExprs`, keyed by attribute name. Data attributes always
 * resolve to `node.<name>` (the walk-step helper emits that for them).
 */
export function getRebuildCallFragment(
    node: NodeSpec,
    config: NodeConstructorConfig | undefined,
    rebuildExprs: ReadonlyMap<string, Fragment>,
    options: Pick<ResolvedRenderOptions, 'identityVisitorWalkOrder' | 'mergeVisitorWalkOrder'>,
): Fragment {
    const constructorRef = use(node.kind, '@codama/nodes');
    if (config === undefined || config.positionalArgs === undefined) {
        return buildObjectInputCall(node, constructorRef, rebuildExprs, options);
    }
    return buildPositionalCall(node, config, config.positionalArgs, constructorRef, rebuildExprs, options);
}

function buildObjectInputCall(
    node: NodeSpec,
    constructorRef: Fragment,
    rebuildExprs: ReadonlyMap<string, Fragment>,
    options: Pick<ResolvedRenderOptions, 'identityVisitorWalkOrder' | 'mergeVisitorWalkOrder'>,
): Fragment {
    // Order matters: JS evaluates object-literal field assignments in
    // source order, so the rebuild's field order IS the visitor's
    // walk order for inline visit-and-filter chains. Use the identity
    // walk order so the visitor's traversal sequence matches what
    // `recordNodeStackVisitor` + selector matching observe.
    const visitedChildFields = getIdentityWalkOrder(node, options).map(attr =>
        buildField(attr, rebuildExprs.get(attr.name)),
    );

    if (visitedChildFields.length === 0) {
        return fragment`return ${constructorRef}({ ...node });`;
    }

    const fieldsBlock = mergeFragments(visitedChildFields, ps => ps.join(', '));
    return fragment`return ${constructorRef}({ ...node, ${fieldsBlock} });`;
}

function buildPositionalCall(
    node: NodeSpec,
    config: NodeConstructorConfig,
    positionalArgs: readonly string[],
    constructorRef: Fragment,
    rebuildExprs: ReadonlyMap<string, Fragment>,
    options: Pick<ResolvedRenderOptions, 'identityVisitorWalkOrder' | 'mergeVisitorWalkOrder'>,
): Fragment {
    const positionalSet = new Set(positionalArgs);
    const positionalFragments = positionalArgs.map(name => {
        const expr = rebuildExprs.get(name);
        if (!expr) {
            throw new Error(
                `positional arg "${name}" on node "${node.kind}" has no rebuild expression — is it declared in the spec?`,
            );
        }
        return expr;
    });

    // Remaining attributes = every spec attribute NOT in positionalArgs
    // and NOT marked `hidden: true`. Hidden defaults are baked into the
    // constructor and the visitor doesn't expose them, so they're left
    // off the options bag.
    const remainingAttrs = node.attributes.filter(attr => {
        if (positionalSet.has(attr.name)) return false;
        const override = config.attributes?.[attr.name];
        if (override && 'default' in override && override.hidden) return false;
        return true;
    });

    if (remainingAttrs.length === 0) {
        const argsBlock = mergeFragments(positionalFragments, ps => ps.join(', '));
        return fragment`return ${constructorRef}(${argsBlock});`;
    }

    // Hybrid: positionals + options bag. Only **visited child** attrs
    // need explicit field mentions in the options bag; data attrs flow
    // through `...node`. If no visited child sits in the options bag,
    // it's just `{ ...node }`. Walk order matters: JS evaluates the
    // options-bag literal's fields in source order, so honour the
    // identity walk order for the children in the bag.
    const identityOrder = getIdentityWalkOrder(node, options);
    const remainingChildren = new Set(remainingAttrs.filter(attr => isChildAttribute(attr.type)).map(a => a.name));
    const visitedRemainingFields = identityOrder
        .filter(attr => remainingChildren.has(attr.name))
        .map(attr => buildField(attr, rebuildExprs.get(attr.name)));

    const optionsBag =
        visitedRemainingFields.length === 0
            ? fragment`{ ...node }`
            : fragment`{ ...node, ${mergeFragments(visitedRemainingFields, ps => ps.join(', '))} }`;

    const argsBlock = mergeFragments([...positionalFragments, optionsBag], ps => ps.join(', '));
    return fragment`return ${constructorRef}(${argsBlock});`;
}

function buildField(attr: AttributeSpec, rebuildExpr: Fragment | undefined): Fragment {
    if (!rebuildExpr) {
        throw new Error(`attribute "${attr.name}" has no rebuild expression.`);
    }
    // When the rebuild expression is exactly the attribute's local
    // name (single-node visit produces a local with the same name as
    // the attribute), emit object shorthand `{ name }` instead of
    // `{ name: name }`.
    if (rebuildExpr.content === attr.name) {
        return fragment`${rebuildExpr}`;
    }
    return fragment`${attr.name}: ${rebuildExpr}`;
}
