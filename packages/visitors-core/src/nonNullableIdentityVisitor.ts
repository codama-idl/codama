import { Node, NodeKind } from '@codama/nodes';

import { identityVisitor } from './identityVisitor';
import { Visitor } from './visitor';

export function nonNullableIdentityVisitor<TNodeKind extends NodeKind = NodeKind>(
    options: { keys?: TNodeKind[] } = {},
): Visitor<Node, TNodeKind> {
    return identityVisitor<TNodeKind>(options) as Visitor<Node, TNodeKind>;
}
