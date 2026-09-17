/**
 * Per-package default options shared by the `nodeTypes` and `nodes`
 * generators so the interface and constructor sides stay in lockstep.
 * Future spec versions can ship their own defaults alongside these
 * without breaking existing callers.
 */

/**
 * Data attributes that surface as type parameters even though the
 * spec classifies them as data. Each entry preserves a narrowing form
 * (e.g. `IntegerTypeNode<'u32'>`) that downstream code relies on.
 */
export const NARROWABLE_DATA_ATTRIBUTES: ReadonlySet<string> = new Set([
    'integerTypeNode:format',
    'floatTypeNode:format',
    'stringTypeNode:encoding',
]);

/**
 * Per-node override of the type-parameter emission order. Each value
 * must enumerate exactly the set of attributes that surface as type
 * parameters for the node — no missing, no extras — otherwise both
 * generators throw at startup rather than silently drop or reorder
 * type parameters.
 *
 * In v2 `docs` is a `string | textNode` child attribute, so it now
 * surfaces as a leading type parameter on every documented node; the
 * remaining order mirrors v1's emission order to minimise downstream
 * churn beyond that addition.
 */
export const GENERIC_PARAM_ORDER: ReadonlyMap<string, readonly string[]> = new Map([
    ['programNode', ['docs', 'pdas', 'accounts', 'instructions', 'definedTypes', 'errors', 'events', 'constants']],
    ['pdaValueNode', ['seeds', 'programId', 'pda']],
    [
        'instructionNode',
        [
            'docs',
            'accounts',
            'data',
            'remainingAccounts',
            'byteDeltas',
            'discriminators',
            'subInstructions',
            'status',
            'provides',
            'display',
        ],
    ],
]);

/**
 * Mapping from spec category name to the output subdirectory each
 * generator emits its entities into (relative to `generated/`). The
 * empty string places `topLevel` entities at the root.
 */
export const CATEGORY_DIRECTORIES: ReadonlyMap<string, string> = new Map([
    ['contextualValue', 'contextualValueNodes'],
    ['count', 'countNodes'],
    ['discriminator', 'discriminatorNodes'],
    ['display', 'displayNodes'],
    ['link', 'linkNodes'],
    ['pdaSeed', 'pdaSeedNodes'],
    ['shared', 'shared'],
    ['topLevel', ''],
    ['transform', 'transformNodes'],
    ['type', 'typeNodes'],
    ['value', 'valueNodes'],
]);
