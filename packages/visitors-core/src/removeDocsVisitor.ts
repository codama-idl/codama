import { NodeKind } from '@kinobi-so/nodes';

import { interceptVisitor } from './interceptVisitor';
import { nonNullableIdentityVisitor } from './nonNullableIdentityVisitor';

export function removeDocsVisitor<TNodeKind extends NodeKind = NodeKind>(nodeKeys?: TNodeKind[]) {
    return interceptVisitor(nonNullableIdentityVisitor(nodeKeys), (node, next) => {
        if ('docs' in node) {
            return next({ ...node, docs: [] });
        }
        return next(node);
    });
}
