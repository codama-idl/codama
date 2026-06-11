import { type AttributeSpec, isChildAttribute, type NodeSpec, type Spec } from '@codama/spec';

import { CATEGORY_DIRECTORIES } from './defaults';

/**
 * Render-option fields shared by both generators. Each generator
 * declares its own `RenderOptions extends SharedRenderOptions` so it
 * can add generator-specific knobs alongside the shared ones.
 */
export interface SharedRenderOptions {
    /**
     * Map from each spec `category.name` to the output subdirectory
     * its entities are emitted into (relative to `generated/`). Use an
     * empty string for the top-level (no subdirectory). Omitted means
     * "use the v1 defaults" ({@link CATEGORY_DIRECTORIES}).
     */
    readonly categoryDirectories?: ReadonlyMap<string, string>;
    /**
     * Per-node override of the type-parameter emission order. Each
     * value must enumerate exactly the set of attributes that surface
     * as type parameters for the node — no more, no fewer — otherwise
     * the run fails.
     */
    readonly genericParamOrder?: ReadonlyMap<string, readonly string[]>;
    /**
     * `${nodeKind}:${attribute}` keys whose data attribute should
     * surface as a type parameter even though the spec classifies it
     * as data. Omitted means "only child attributes become type
     * parameters".
     */
    readonly narrowableDataAttributes?: ReadonlySet<string>;
    /** The spec major version this invocation targets. */
    readonly targetSpecMajor: number;
}

/** {@link SharedRenderOptions} with every defaultable field resolved. */
export type SharedResolvedRenderOptions = Required<SharedRenderOptions>;

export function resolveSharedRenderOptions(options: SharedRenderOptions): SharedResolvedRenderOptions {
    return {
        categoryDirectories: options.categoryDirectories ?? CATEGORY_DIRECTORIES,
        genericParamOrder: options.genericParamOrder ?? new Map(),
        narrowableDataAttributes: options.narrowableDataAttributes ?? new Set(),
        targetSpecMajor: options.targetSpecMajor,
    };
}

/**
 * Cross-check the caller-supplied options against the spec at
 * generation time. Catches stale `narrowableDataAttributes` entries,
 * stale `genericParamOrder` overrides, and missing `categoryDirectories`
 * entries whose keys no longer match the spec.
 */
export function validateSharedRenderOptions(spec: Spec, options: SharedRenderOptions): void {
    const actualMajor = parseSpecMajor(spec.version);
    if (actualMajor !== options.targetSpecMajor) {
        throw new Error(
            `targetSpecMajor=${options.targetSpecMajor} but the supplied spec is at version "${spec.version}" (major ${actualMajor}).`,
        );
    }

    const allNodes = spec.categories.flatMap(c => c.nodes);
    const validNodeKinds = new Set(allNodes.map(n => n.kind));
    const validKeys = new Set(allNodes.flatMap(n => n.attributes.map(a => `${n.kind}:${a.name}`)));

    if (options.categoryDirectories) {
        const missing = spec.categories.find(c => !options.categoryDirectories!.has(c.name));
        if (missing) {
            throw new Error(`categoryDirectories is missing an entry for spec category "${missing.name}".`);
        }
    }

    if (options.narrowableDataAttributes) {
        for (const key of options.narrowableDataAttributes) {
            if (!validKeys.has(key)) {
                throw new Error(
                    `narrowableDataAttributes references "${key}" which is not a (nodeKind, attribute) pair in the spec.`,
                );
            }
        }
    }

    if (options.genericParamOrder) {
        for (const [kind, order] of options.genericParamOrder) {
            if (!validNodeKinds.has(kind)) {
                throw new Error(`genericParamOrder references unknown node kind "${kind}".`);
            }
            for (const attrName of order) {
                if (!validKeys.has(`${kind}:${attrName}`)) {
                    throw new Error(
                        `genericParamOrder for "${kind}" references attribute "${attrName}" which the spec does not declare.`,
                    );
                }
            }
        }
    }
}

/**
 * Decide whether an attribute surfaces as a type parameter on the
 * generated node interface or node function. An attribute becomes a
 * type parameter when its type tree contains a node / union / nested-
 * union reference, or when its `${kind}:${name}` key appears in
 * `narrowableDataAttributes`.
 */
export function isNodeTypeParameterAttribute(
    nodeKind: string,
    attr: AttributeSpec,
    options: Pick<SharedResolvedRenderOptions, 'narrowableDataAttributes'>,
): boolean {
    return isChildAttribute(attr.type) || options.narrowableDataAttributes.has(`${nodeKind}:${attr.name}`);
}

/**
 * Return the spec attributes that surface as type parameters for
 * `node`, in their emission order. Filters the node's attributes via
 * {@link isNodeTypeParameterAttribute}, then applies the per-node
 * `genericParamOrder` override when one is configured.
 *
 * The override must enumerate exactly the resulting type-parameter
 * set — no missing, no extras — otherwise we throw rather than
 * silently drop or reorder type parameters.
 */
export function getNodeTypeParameterAttributes(
    node: NodeSpec,
    options: Pick<SharedResolvedRenderOptions, 'genericParamOrder' | 'narrowableDataAttributes'>,
): readonly AttributeSpec[] {
    const filtered = node.attributes.filter(a => isNodeTypeParameterAttribute(node.kind, a, options));
    const order = options.genericParamOrder.get(node.kind);
    if (!order) return filtered;

    const byName = new Map(filtered.map(a => [a.name, a]));
    const declared = new Set(byName.keys());
    const overrideSet = new Set(order);
    const missing = [...declared].filter(n => !overrideSet.has(n));
    const unknown = order.filter(n => !declared.has(n));
    if (missing.length > 0 || unknown.length > 0) {
        const parts: string[] = [];
        if (missing.length > 0) parts.push(`missing type-parameter attribute(s) ${JSON.stringify(missing)}`);
        if (unknown.length > 0) parts.push(`unknown attribute(s) ${JSON.stringify(unknown)}`);
        throw new Error(`genericParamOrder for "${node.kind}" is out of sync with the spec: ${parts.join('; ')}.`);
    }
    return order.map(name => byName.get(name)!);
}

function parseSpecMajor(version: string): number {
    const m = /^(\d+)\./.exec(version);
    if (!m) throw new Error(`unable to parse spec version "${version}".`);
    return Number(m[1]);
}
