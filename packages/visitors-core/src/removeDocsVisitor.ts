import { NodeKind } from '@codama/nodes';

import { interceptVisitor } from './interceptVisitor';
import { nonNullableIdentityVisitor } from './nonNullableIdentityVisitor';

/**
 * Strip docs from every node the visitor passes over.
 *
 * Constructors in `@codama/nodes` omit the `docs` attribute entirely
 * when its value would be empty (matching the Rust side and avoiding
 * gratuitous `docs: []` noise in encoded IDLs). This visitor follows
 * the same convention — it removes the `docs` key altogether rather
 * than blanking it to `[]`.
 */
export function removeDocsVisitor<TNodeKind extends NodeKind = NodeKind>(options: { keys?: TNodeKind[] } = {}) {
    return interceptVisitor(nonNullableIdentityVisitor(options), (node, next) => {
        if ('docs' in node) {
            const copy = { ...node } as typeof node & { docs?: unknown };
            delete copy.docs;
            return next(copy as typeof node);
        }
        return next(node);
    });
}
