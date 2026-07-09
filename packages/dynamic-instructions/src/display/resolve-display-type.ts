import {
    type DefinedTypeNode,
    getLastNodeFromPath,
    isNode,
    type NodePath,
    resolveNestedTypeNode,
    type TypeNode,
} from 'codama';

import type { DisplayContext } from './types';

/** A type resolved through its display links, paired with the path to where it now lives. */
export type ResolvedDisplayType = {
    /** The path locating the resolved type's owner, used to resolve any links nested within it. */
    readonly ownerPath: NodePath;
    /** The resolved type, with wrappers stripped and any top-level link followed. */
    readonly type: TypeNode;
};

/**
 * Resolves nested type wrappers and follows a single `definedTypeLinkNode` to its underlying type.
 * Shared by the value formatter, the fallback list, and consumed-member collection so links resolve
 * identically everywhere.
 *
 * The link is resolved by its full path (`ownerPath` plus the link), so the linkable dictionary
 * targets the program the link appears in. When a link is followed, the returned `ownerPath` is
 * rebased onto the resolved defined type so links nested within it — possibly in another program —
 * resolve from the correct location.
 */
export function resolveDisplayType(
    type: TypeNode,
    ownerPath: NodePath,
    displayContext: Omit<DisplayContext, 'consumedMemberNames'>,
): ResolvedDisplayType {
    const resolved = resolveNestedTypeNode(type);
    if (isNode(resolved, 'definedTypeLinkNode')) {
        const definedTypePath = displayContext.resolveDefinedType([...ownerPath, resolved]);
        if (definedTypePath) {
            const definedType = getLastNodeFromPath<DefinedTypeNode>(definedTypePath);
            return { ownerPath: definedTypePath, type: resolveNestedTypeNode(definedType.type) };
        }
    }
    return { ownerPath, type: resolved };
}
