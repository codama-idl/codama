import { CODAMA_ERROR__UNEXPECTED_NODE_KIND, CodamaError } from '@codama/errors';
import type { GetNodeFromKind, Node, NodeKind } from '@codama/node-types';

export function isNode<TKind extends NodeKind>(
    node: Node | null | undefined,
    kind: TKind | TKind[],
): node is GetNodeFromKind<TKind> {
    const kinds = Array.isArray(kind) ? kind : [kind];
    return !!node && (kinds as NodeKind[]).includes(node.kind);
}

export function assertIsNode<TKind extends NodeKind>(
    node: Node | null | undefined,
    kind: TKind | TKind[],
): asserts node is GetNodeFromKind<TKind> {
    const kinds = Array.isArray(kind) ? kind : [kind];
    if (!isNode(node, kinds)) {
        throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
            expectedKinds: kinds,
            kind: node?.kind ?? null,
            node,
        });
    }
}

export function isNodeFilter<TKind extends NodeKind>(
    kind: TKind | TKind[],
): (node: Node | null | undefined) => node is GetNodeFromKind<TKind> {
    return (node): node is GetNodeFromKind<TKind> => isNode(node, kind);
}

export function assertIsNodeFilter<TKind extends NodeKind>(
    kind: TKind | TKind[],
): (node: Node | null | undefined) => node is GetNodeFromKind<TKind> {
    return (node): node is GetNodeFromKind<TKind> => {
        assertIsNode(node, kind);
        return true;
    };
}

export function removeNullAndAssertIsNodeFilter<TKind extends NodeKind>(
    kind: TKind | TKind[],
): (node: Node | null | undefined) => node is GetNodeFromKind<TKind> {
    return (node): node is GetNodeFromKind<TKind> => {
        if (node) assertIsNode(node, kind);
        return node != null;
    };
}
