import type { NodeSpec, Spec } from '@codama/spec';

/**
 * Return a copy of `spec` with its base attributes (`spec.base.attributes`,
 * currently just the universal `plugins`) appended to every node, after
 * each node's declared attributes.
 *
 * The spec models attributes shared by every node in a separate `base`
 * block and mandates that codegen "append these after each node's
 * declared attributes… so base attributes always serialise last". Rather
 * than thread the base attributes through every fragment that iterates
 * `node.attributes`, we materialise them onto each `NodeSpec` once at the
 * generator entry point; every downstream consumer then sees `plugins`
 * as an ordinary trailing child attribute with no special-casing.
 *
 * `spec.base` is optional (absent when the spec declares no base
 * attributes), in which case the spec is returned unchanged.
 */
export function withBaseAttributes(spec: Spec): Spec {
    const baseAttributes = spec.base?.attributes ?? [];
    if (baseAttributes.length === 0) return spec;
    return {
        ...spec,
        categories: spec.categories.map(category => ({
            ...category,
            nodes: category.nodes.map(
                (node): NodeSpec => ({ ...node, attributes: [...node.attributes, ...baseAttributes] }),
            ),
        })),
    };
}
