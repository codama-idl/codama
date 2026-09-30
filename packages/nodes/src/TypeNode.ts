import type { TransformNode, TypeNode } from '@codama/node-types';

/**
 * Return a copy of `typeNode` with the given `transforms` appended after
 * any it already carries.
 *
 * Transforms apply in array order, the first being the innermost, so
 * appending keeps the node's existing transforms innermost and layers the
 * new ones on the outside. This is the v2 counterpart of re-wrapping a
 * type in its original wrapper nodes: a consumer that replaces a type node
 * (e.g. rebuilds a `structTypeNode`) can carry the original's transforms
 * across with `addTypeNodeTransforms(newNode, oldNode.transforms ?? [])`
 * instead of a double spread.
 *
 * Only pass transforms the target node does not already carry. A node
 * derived by spreading the original (`{ ...oldNode, fields }`) already has
 * `oldNode.transforms`, so calling `addTypeNodeTransforms(rebuilt,
 * oldNode.transforms ?? [])` on it would duplicate them.
 *
 * When `transforms` is empty the node is returned unchanged. The result
 * omits the `transforms` attribute entirely when there is nothing to
 * carry, matching the generated constructors.
 *
 * The return type keeps `T` for ergonomics; the node's `TTransforms` type
 * parameter is not re-derived, as with the generated constructors' own
 * `as TTransforms` casts.
 */
export function addTypeNodeTransforms<T extends TypeNode>(typeNode: T, transforms: readonly TransformNode[]): T {
    if (transforms.length === 0) return typeNode;
    const merged = [...(typeNode.transforms ?? []), ...transforms];
    // Spreading a generic `T` widens to an index-signature object, so the
    // narrowed node type has to be reasserted through `unknown`.
    return Object.freeze({ ...typeNode, transforms: merged }) as unknown as T;
}
