import { NodeKind } from '@codama/nodes';

import { interceptVisitor } from './interceptVisitor';
import { nonNullableIdentityVisitor } from './nonNullableIdentityVisitor';

export function removeDocsVisitor<TNodeKind extends NodeKind = NodeKind>(options: { keys?: TNodeKind[] } = {}) {
    return interceptVisitor(nonNullableIdentityVisitor(options), (node, next) => {
        if ('docs' in node) {
            return next({ ...node, docs: [] });
        }
        return next(node);
    });
}
