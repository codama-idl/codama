import {
    assertIsNode,
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTupleVariantTypeNode,
    hiddenPrefixTypeNode,
    hiddenSuffixTypeNode,
    type Node,
    type NodeKind,
    REGISTERED_NODE_KINDS,
    removeNullAndAssertIsNodeFilter,
    resolverValueNode,
    TYPE_NODES,
} from '@codama/nodes';

import { extendVisitor, type VisitorOverrides } from './extendVisitor';
import { identityVisitor as identityVisitorCore } from './generated/identityVisitor';
import { visit as baseVisit, type Visitor } from './visitor';

/**
 * Identity visitor: rebuilds the tree node-by-node so callers can
 * intercept individual nodes via override hooks while leaving the rest
 * untouched. Returns `null` to drop a node (and its parents that
 * required it).
 *
 * The mechanical walk lives in `./generated/identityVisitor` (one
 * branch per spec node, derived from the attribute structure of
 * `@codama/spec`). This wrapper layers a handful of *semantic*
 * overrides on top — transformations that aren't derivable from the
 * spec alone:
 *
 *   - `enumStructVariantTypeNode` / `enumTupleVariantTypeNode`:
 *     downgrade to `enumEmptyVariantTypeNode` when the payload is
 *     empty (no fields / no items).
 *   - `hiddenPrefixTypeNode` / `hiddenSuffixTypeNode`: drop the
 *     wrapper when the prefix/suffix array is empty.
 *   - `conditionalValueNode`: return `null` when both `ifTrue` and
 *     `ifFalse` are absent post-walk.
 *   - `resolverValueNode`: collapse an empty `dependsOn` array back
 *     to `undefined` so equality checks remain stable.
 */
export function identityVisitor<TNodeKind extends NodeKind = NodeKind>(
    options: { keys?: TNodeKind[] } = {},
): Visitor<Node | null, TNodeKind> {
    const keys: NodeKind[] = options.keys ?? (REGISTERED_NODE_KINDS as TNodeKind[]);
    const base = identityVisitorCore(options);
    // Build overrides against the broad `NodeKind` shape; the cast
    // back to the narrowed visitor happens at `extendVisitor`'s
    // return. This mirrors the pattern the hand-written visitor used
    // for years: every override is type-checked against the full Node
    // union, then `extendVisitor` ignores any override whose kind
    // isn't actually in `keys` at runtime.
    const overrides: VisitorOverrides<Node | null, NodeKind> = {};
    const visit =
        (v: Visitor<Node | null>) =>
        (node: Node): Node | null =>
            keys.includes(node.kind) ? baseVisit(node, v) : Object.freeze({ ...node });

    if (keys.includes('enumStructVariantTypeNode' as TNodeKind)) {
        overrides.visitEnumStructVariantType = function visitEnumStructVariantType(node, { self }) {
            const newStruct = visit(self)(node.struct);
            if (!newStruct) {
                return enumEmptyVariantTypeNode(node.name);
            }
            assertIsNode(newStruct, 'structTypeNode');
            if (newStruct.fields.length === 0) {
                return enumEmptyVariantTypeNode(node.name);
            }
            return enumStructVariantTypeNode(node.name, newStruct, node.discriminator);
        };
    }

    if (keys.includes('enumTupleVariantTypeNode' as TNodeKind)) {
        overrides.visitEnumTupleVariantType = function visitEnumTupleVariantType(node, { self }) {
            const newTuple = visit(self)(node.tuple);
            if (!newTuple) {
                return enumEmptyVariantTypeNode(node.name);
            }
            assertIsNode(newTuple, 'tupleTypeNode');
            if (newTuple.items.length === 0) {
                return enumEmptyVariantTypeNode(node.name);
            }
            return enumTupleVariantTypeNode(node.name, newTuple, node.discriminator);
        };
    }

    if (keys.includes('hiddenPrefixTypeNode' as TNodeKind)) {
        overrides.visitHiddenPrefixType = function visitHiddenPrefixType(node, { self }) {
            const type = visit(self)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            const prefix = (node.prefix ?? [])
                .map(visit(self))
                .filter(removeNullAndAssertIsNodeFilter('constantValueNode'));
            if (prefix.length === 0) return type;
            return hiddenPrefixTypeNode(type, prefix);
        };
    }

    if (keys.includes('hiddenSuffixTypeNode' as TNodeKind)) {
        overrides.visitHiddenSuffixType = function visitHiddenSuffixType(node, { self }) {
            const type = visit(self)(node.type);
            if (type === null) return null;
            assertIsNode(type, TYPE_NODES);
            const suffix = (node.suffix ?? [])
                .map(visit(self))
                .filter(removeNullAndAssertIsNodeFilter('constantValueNode'));
            if (suffix.length === 0) return type;
            return hiddenSuffixTypeNode(type, suffix);
        };
    }

    if (keys.includes('conditionalValueNode' as TNodeKind)) {
        overrides.visitConditionalValue = function visitConditionalValue(node, { next }) {
            // Walk via the generated branch first, then enforce the
            // "both arms absent → drop the node" rule. The generated
            // visitor preserves all visited attrs, so we can inspect
            // the result post-walk rather than re-implementing the
            // walk here.
            const visited = next(node);
            if (visited === null || visited.kind !== 'conditionalValueNode') return visited;
            if (visited.ifTrue === undefined && visited.ifFalse === undefined) return null;
            return visited;
        };
    }

    if (keys.includes('resolverValueNode' as TNodeKind)) {
        overrides.visitResolverValue = function visitResolverValue(node, { self }) {
            const dependsOn = (node.dependsOn ?? [])
                .map(visit(self))
                .filter(removeNullAndAssertIsNodeFilter(['accountValueNode', 'argumentValueNode']));
            return resolverValueNode(node.name, {
                ...node,
                dependsOn: dependsOn.length === 0 ? undefined : dependsOn,
            });
        };
    }

    return extendVisitor(base as unknown as Visitor<Node | null, NodeKind>, overrides) as unknown as Visitor<
        Node | null,
        TNodeKind
    >;
}
