import { KINOBI_ERROR__UNEXPECTED_NODE_KIND, KinobiError } from '@kinobi-so/errors';
import type { GetNodeFromKind, Node, NodeKind } from '@kinobi-so/node-types';

import { REGISTERED_CONTEXTUAL_VALUE_NODE_KINDS } from './contextualValueNodes/ContextualValueNode';
import { REGISTERED_COUNT_NODE_KINDS } from './countNodes/CountNode';
import { REGISTERED_DISCRIMINATOR_NODE_KINDS } from './discriminatorNodes/DiscriminatorNode';
import { REGISTERED_LINK_NODE_KINDS } from './linkNodes/LinkNode';
import { REGISTERED_PDA_SEED_NODE_KINDS } from './pdaSeedNodes/PdaSeedNode';
import { REGISTERED_TYPE_NODE_KINDS } from './typeNodes/TypeNode';
import { REGISTERED_VALUE_NODE_KINDS } from './valueNodes/ValueNode';

// Node Registration.
export const REGISTERED_NODE_KINDS = [
    ...REGISTERED_CONTEXTUAL_VALUE_NODE_KINDS,
    ...REGISTERED_DISCRIMINATOR_NODE_KINDS,
    ...REGISTERED_LINK_NODE_KINDS,
    ...REGISTERED_PDA_SEED_NODE_KINDS,
    ...REGISTERED_COUNT_NODE_KINDS,
    ...REGISTERED_TYPE_NODE_KINDS,
    ...REGISTERED_VALUE_NODE_KINDS,
    'rootNode' as const,
    'programNode' as const,
    'pdaNode' as const,
    'accountNode' as const,
    'instructionAccountNode' as const,
    'instructionArgumentNode' as const,
    'instructionByteDeltaNode' as const,
    'instructionNode' as const,
    'instructionRemainingAccountsNode' as const,
    'errorNode' as const,
    'definedTypeNode' as const,
];

// Node Helpers.

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
        throw new KinobiError(KINOBI_ERROR__UNEXPECTED_NODE_KIND, {
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
