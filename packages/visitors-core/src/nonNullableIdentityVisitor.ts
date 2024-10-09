import { Node, NodeKind, REGISTERED_NODE_KINDS } from '@codama/nodes';

import { identityVisitor } from './identityVisitor';
import { Visitor } from './visitor';

export function nonNullableIdentityVisitor<TNodeKind extends NodeKind = NodeKind>(
    nodeKeys: TNodeKind[] = REGISTERED_NODE_KINDS as TNodeKind[],
): Visitor<Node, TNodeKind> {
    return identityVisitor<TNodeKind>(nodeKeys) as Visitor<Node, TNodeKind>;
}
