import type { Path } from '@codama/fragments/javascript';
import { type AttributeSpec, isChildAttribute, type Spec } from '@codama/spec';

/** User-facing options for the `@codama/node-types` generator. */
export interface RenderOptions {
    /**
     * Map from each spec `category.name` to the output subdirectory
     * its entities are emitted into (relative to `generated/`). Use an
     * empty string for the top-level (no subdirectory). Omitted means
     * "use the v1 defaults" ({@link CATEGORY_DIRECTORIES}).
     */
    readonly categoryDirectories?: ReadonlyMap<string, string>;
    /**
     * Per-node override of the type-parameter emission order. Each
     * value must enumerate exactly the set of attributes lifted for
     * the node — no more, no fewer — otherwise the run fails.
     */
    readonly genericParamOrder?: ReadonlyMap<string, readonly string[]>;
    /**
     * `${nodeKind}:${attribute}` keys whose data attribute should be
     * lifted to a generic param even though the spec classifies it as
     * data. Omitted means "lift only children".
     */
    readonly narrowableDataAttributes?: ReadonlySet<string>;
    /** The spec major version this invocation targets. */
    readonly targetSpecMajor: number;
}

/** Options consumed by {@link generateNodeTypes}, the disk-writing entry point. */
export interface GenerateOptions extends RenderOptions {
    readonly outputDir: Path;
}

/** {@link RenderOptions} with every defaultable field resolved. */
export interface ResolvedRenderOptions {
    readonly categoryDirectories: ReadonlyMap<string, string>;
    readonly genericParamOrder: ReadonlyMap<string, readonly string[]>;
    readonly narrowableDataAttributes: ReadonlySet<string>;
    readonly targetSpecMajor: number;
}

export function resolveRenderOptions(options: RenderOptions): ResolvedRenderOptions {
    return {
        categoryDirectories: options.categoryDirectories ?? CATEGORY_DIRECTORIES,
        genericParamOrder: options.genericParamOrder ?? new Map(),
        narrowableDataAttributes: options.narrowableDataAttributes ?? new Set(),
        targetSpecMajor: options.targetSpecMajor,
    };
}

/**
 * Default narrowable data attributes for the v1 spec. Each entry
 * preserves a narrowing form supported by the legacy `@codama/node-types`
 * interface (e.g. `NumberTypeNode<'u32'>`) that downstream constructors
 * in `@codama/nodes` rely on.
 */
export const NARROWABLE_DATA_ATTRIBUTES: ReadonlySet<string> = new Set([
    'numberTypeNode:format',
    'stringTypeNode:encoding',
]);

/**
 * Default per-node type-parameter ordering for the v1 spec. Preserves
 * the positional generic args of the legacy `@codama/node-types`
 * package: legacy generics keep their original positions, any extra
 * generics our renderer adds appear at the end.
 */
export const GENERIC_PARAM_ORDER: ReadonlyMap<string, readonly string[]> = new Map([
    ['programNode', ['pdas', 'accounts', 'instructions', 'definedTypes', 'errors', 'events', 'constants']],
    ['pdaValueNode', ['seeds', 'programId', 'pda']],
    ['instructionArgumentNode', ['defaultValue', 'type']],
    [
        'instructionNode',
        [
            'accounts',
            'arguments',
            'extraArguments',
            'remainingAccounts',
            'byteDeltas',
            'discriminators',
            'subInstructions',
            'status',
        ],
    ],
]);

/**
 * Default mapping from spec category name to output subdirectory for
 * the v1 spec. The empty string places `topLevel` entities at the root
 * of `generated/`.
 */
export const CATEGORY_DIRECTORIES: ReadonlyMap<string, string> = new Map([
    ['contextualValue', 'contextualValueNodes'],
    ['count', 'countNodes'],
    ['discriminator', 'discriminatorNodes'],
    ['link', 'linkNodes'],
    ['pdaSeed', 'pdaSeedNodes'],
    ['shared', 'shared'],
    ['topLevel', ''],
    ['type', 'typeNodes'],
    ['value', 'valueNodes'],
]);

/**
 * Cross-check the caller-supplied options against the spec at
 * generation time. Catches stale `narrowableDataAttributes` entries,
 * stale `genericParamOrder` overrides, and missing `categoryDirectories`
 * entries whose keys no longer match the spec.
 */
export function validateRenderOptions(spec: Spec, options: RenderOptions): void {
    const actualMajor = parseSpecMajor(spec.version);
    if (actualMajor !== options.targetSpecMajor) {
        throw new Error(
            `@codama/node-types generator: targetSpecMajor=${options.targetSpecMajor} but the supplied spec is at version "${spec.version}" (major ${actualMajor}).`,
        );
    }

    const validKeys = new Set<string>();
    const validNodeKinds = new Set<string>();
    for (const category of spec.categories) {
        for (const node of category.nodes) {
            validNodeKinds.add(node.kind);
            for (const attr of node.attributes) {
                validKeys.add(`${node.kind}:${attr.name}`);
            }
        }
    }

    if (options.categoryDirectories) {
        for (const category of spec.categories) {
            if (!options.categoryDirectories.has(category.name)) {
                throw new Error(
                    `@codama/node-types generator: categoryDirectories is missing an entry for spec category "${category.name}".`,
                );
            }
        }
    }

    if (options.narrowableDataAttributes) {
        for (const key of options.narrowableDataAttributes) {
            if (!validKeys.has(key)) {
                throw new Error(
                    `@codama/node-types generator: narrowableDataAttributes references "${key}" which is not a (nodeKind, attribute) pair in the spec.`,
                );
            }
        }
    }

    if (options.genericParamOrder) {
        for (const [kind, order] of options.genericParamOrder) {
            if (!validNodeKinds.has(kind)) {
                throw new Error(
                    `@codama/node-types generator: genericParamOrder references unknown node kind "${kind}".`,
                );
            }
            for (const attrName of order) {
                if (!validKeys.has(`${kind}:${attrName}`)) {
                    throw new Error(
                        `@codama/node-types generator: genericParamOrder for "${kind}" references attribute "${attrName}" which the spec does not declare.`,
                    );
                }
            }
        }
    }
}

/**
 * Decide whether an attribute lifts to a generic param. An attribute
 * lifts when its type tree contains a node / union / nested-union
 * reference, or when its `${kind}:${name}` key appears in
 * `narrowableDataAttributes`.
 */
export function isAttributeLifted(
    nodeKind: string,
    attr: AttributeSpec,
    options: Pick<ResolvedRenderOptions, 'narrowableDataAttributes'>,
): boolean {
    return isChildAttribute(attr.type) || options.narrowableDataAttributes.has(`${nodeKind}:${attr.name}`);
}

function parseSpecMajor(version: string): number {
    const m = /^(\d+)\./.exec(version);
    if (!m) throw new Error(`@codama/node-types generator: unable to parse spec version "${version}".`);
    return Number(m[1]);
}
