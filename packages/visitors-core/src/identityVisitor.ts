import { type Node, type NodeKind, REGISTERED_NODE_KINDS } from '@codama/nodes';

import { extendVisitor, type VisitorOverrides } from './extendVisitor';
import { identityVisitor as identityVisitorCore } from './generated/identityVisitor';
import { type Visitor } from './visitor';

/**
 * Identity visitor: rebuilds the tree node-by-node so callers can
 * intercept individual nodes via override hooks while leaving the rest
 * untouched. Returns `null` to drop a node (and its parents that
 * required it).
 *
 * The mechanical walk lives in `./generated/identityVisitor` (one
 * branch per spec node, derived from the attribute structure of
 * `@codama/spec`). This wrapper layers the *semantic* overrides that
 * aren't derivable from the spec alone:
 *
 *   - `conditionalValueNode`: return `null` when both `ifTrue` and
 *     `ifFalse` are absent post-walk.
 */
export function identityVisitor<TNodeKind extends NodeKind = NodeKind>(
    options: { keys?: TNodeKind[] } = {},
): Visitor<Node | null, TNodeKind> {
    const keys: NodeKind[] = options.keys ?? (REGISTERED_NODE_KINDS as TNodeKind[]);
    const base = identityVisitorCore(options);
    // Build overrides against the broad `NodeKind` shape; the cast
    // back to the narrowed visitor happens at `extendVisitor`'s
    // return. Every override is type-checked against the full Node
    // union, then `extendVisitor` ignores any override whose kind
    // isn't actually in `keys` at runtime.
    const overrides: VisitorOverrides<Node | null, NodeKind> = {};

    if (keys.includes('conditionalValueNode' as TNodeKind)) {
        overrides.visitConditionalValue = function visitConditionalValue(node, { next }) {
            const visited = next(node);
            if (visited === null || visited.kind !== 'conditionalValueNode') return visited;
            if (visited.ifTrue === undefined && visited.ifFalse === undefined) return null;
            return visited;
        };
    }

    return extendVisitor(base as unknown as Visitor<Node | null, NodeKind>, overrides) as unknown as Visitor<
        Node | null,
        TNodeKind
    >;
}
