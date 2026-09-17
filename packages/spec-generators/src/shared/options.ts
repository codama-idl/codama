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
     * "use the default category directories" ({@link CATEGORY_DIRECTORIES}).
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
 * type parameter when the spec classifies it as a child (a node /
 * union reference), or when its `${kind}:${name}` key appears in
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
 * The override enumerates the node's *declared* type parameters. Base
 * attributes (e.g. the universal `plugins`) are appended to every node
 * last and are deliberately absent from the override maps — the
 * override is applied over the parameters it names, then any remaining
 * type parameters (the base attributes) are force-appended last.
 */
export function getNodeTypeParameterAttributes(
    node: NodeSpec,
    options: Pick<SharedResolvedRenderOptions, 'genericParamOrder' | 'narrowableDataAttributes'>,
): readonly AttributeSpec[] {
    const filtered = node.attributes.filter(a => isNodeTypeParameterAttribute(node.kind, a, options));
    const order = options.genericParamOrder.get(node.kind);
    if (!order) return filtered;

    const byName = new Map(filtered.map(a => [a.name, a]));
    const overrideSet = new Set(order);
    const unknown = order.filter(n => !byName.has(n));
    if (unknown.length > 0) {
        throw new Error(
            `genericParamOrder for "${node.kind}" is out of sync with the spec: unknown attribute(s) ${JSON.stringify(unknown)}.`,
        );
    }
    const ordered = order.map(name => byName.get(name)!);
    const trailing = filtered.filter(a => !overrideSet.has(a.name));
    return [...ordered, ...trailing];
}

/**
 * Reduce a package version to its bare spec version by stripping any
 * pre-release or build metadata (e.g. `"2.0.0-rc.0"` → `"2.0.0"`).
 *
 * `CODAMA_VERSION` names the *spec shape* an IDL conforms to, not the
 * npm package version. A pre-release package (`2.0.0-rc.0`) still
 * implements the v2 spec shape (`2.0.0`) — the shape does not change
 * between rc and stable — so IDLs generated during the candidacy carry
 * the clean spec version and satisfy the strict `CodamaVersion` type.
 */
export function toSpecVersion(version: string): string {
    const m = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
    if (!m) throw new Error(`unable to parse a spec version from "${version}".`);
    return `${m[1]}.${m[2]}.${m[3]}`;
}

/** Parse the major component of a spec version string (e.g. `"2.0.0-rc.0"` → `2`). */
export function parseSpecMajor(version: string): number {
    const m = /^(\d+)\./.exec(version);
    if (!m) throw new Error(`unable to parse spec version "${version}".`);
    return Number(m[1]);
}
