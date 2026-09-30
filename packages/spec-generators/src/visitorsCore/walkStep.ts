import { type AttributeSpec, isChildAttribute, type NodeSpec, type TypeExpr } from '@codama/spec';

import { type ResolvedRenderOptions } from './options';

/**
 * Visitor-side classification of an attribute type. Drives both the
 * identity-visitor walk (visit + assert + rebuild) and the merge-visitor
 * collect (spread visited children into the merge list).
 *
 *   - `data`        — not a child reference; pass through unchanged.
 *   - `node`        — `node('<kind>')`. Walk once, assert `<kind>`.
 *   - `union`       — `union('<Name>')`. Walk once, assert against the
 *                     resolved kind-list.
 *   - `anyNode`     — `anyNode()`. Walk once, assert against the full
 *                     registered-node kind-list.
 *   - `text`        — `string | textNode` (`text`/`docs`). Visit only
 *                     when the value is a `textNode`; a bare string
 *                     passes through unchanged.
 *   - `arrayNode`   — `array(node('<kind>'))`. Walk each, filter.
 *   - `arrayUnion`  — `array(union('<Name>'))`. Walk each, filter
 *                     against the resolved kind-list.
 *
 * Anything else (nested arrays of arrays, tuples-of-nodes) is not
 * expected in the spec; extending the visitor for such shapes would
 * need a new variant here.
 */
export type ChildShape =
    | { readonly kind: 'anyNode' }
    | { readonly kind: 'arrayNode'; readonly nodeKind: string }
    | { readonly kind: 'arrayUnion'; readonly unionName: string }
    | { readonly kind: 'data' }
    | { readonly kind: 'node'; readonly nodeKind: string }
    | { readonly kind: 'text' }
    | { readonly kind: 'union'; readonly unionName: string };

/** Classify a {@link TypeExpr} into the matching {@link ChildShape}. */
export function getChildShape(typeExpr: TypeExpr): ChildShape {
    switch (typeExpr.kind) {
        case 'anyNode':
            return { kind: 'anyNode' };
        case 'node':
            return { kind: 'node', nodeKind: typeExpr.name };
        case 'union':
            return { kind: 'union', unionName: typeExpr.name };
        case 'docs':
        case 'text':
            return { kind: 'text' };
        case 'array': {
            const inner = typeExpr.of;
            if (inner.kind === 'node') return { kind: 'arrayNode', nodeKind: inner.name };
            if (inner.kind === 'union') return { kind: 'arrayUnion', unionName: inner.name };
            return { kind: 'data' };
        }
        default:
            return { kind: 'data' };
    }
}

/**
 * Return the node's child attributes in the order the merge visitor
 * should walk them. Falls back to spec-declaration order; nodes with
 * an explicit override in `options.mergeVisitorWalkOrder` use that
 * instead.
 */
export function getMergeWalkOrder(
    node: NodeSpec,
    options: Pick<ResolvedRenderOptions, 'mergeVisitorWalkOrder'>,
): readonly AttributeSpec[] {
    return resolveWalkOrder(node, options.mergeVisitorWalkOrder, 'mergeVisitorWalkOrder');
}

/**
 * Return the node's child attributes in the order the identity visitor
 * should walk them. The identity visitor's order is independent from
 * the merge visitor's — for `programNode` and `instructionNode` the
 * historic hand-written rebuilds walked attributes in JS object-
 * literal evaluation order (effectively alphabetical), and that order
 * is observable through `recordNodeStackVisitor` + selector matching.
 *
 * Nodes without an entry in `options.identityVisitorWalkOrder` fall
 * back to the merge visitor's walk order, then to spec-declaration
 * order. Identity-specific overrides only need to list the genuinely
 * divergent cases.
 */
export function getIdentityWalkOrder(
    node: NodeSpec,
    options: Pick<ResolvedRenderOptions, 'identityVisitorWalkOrder' | 'mergeVisitorWalkOrder'>,
): readonly AttributeSpec[] {
    if (options.identityVisitorWalkOrder.has(node.kind)) {
        return resolveWalkOrder(node, options.identityVisitorWalkOrder, 'identityVisitorWalkOrder');
    }
    return getMergeWalkOrder(node, options);
}

function resolveWalkOrder(
    node: NodeSpec,
    table: ReadonlyMap<string, readonly string[]>,
    tableName: string,
): readonly AttributeSpec[] {
    const children = node.attributes.filter(attr => isChildAttribute(attr.type));
    const override = table.get(node.kind);
    if (!override) return children;

    // The override enumerates the node's *declared* children. Base
    // attributes (e.g. the universal `plugins`) are appended to every
    // node last and are deliberately absent from the override maps —
    // resolve the override over the children it names, then force-append
    // any remaining children (the base attributes) in declaration order.
    const byName = new Map(children.map(c => [c.name, c]));
    const overrideSet = new Set(override);
    const unknown = override.filter(n => !byName.has(n));
    if (unknown.length > 0) {
        throw new Error(
            `${tableName} for "${node.kind}" is out of sync with the spec: unknown attribute(s) ${JSON.stringify(unknown)}.`,
        );
    }
    const ordered = override.map(name => byName.get(name)!);
    const trailing = children.filter(c => !overrideSet.has(c.name));
    return [...ordered, ...trailing];
}
