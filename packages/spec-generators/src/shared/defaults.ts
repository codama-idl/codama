/**
 * Per-package default options for the v1 spec, shared by the
 * `nodeTypes` and `nodes` generators so the interface and constructor
 * sides stay in lockstep. Future spec versions can ship their own
 * defaults alongside these without breaking v1 callers.
 */

/**
 * Data attributes that surface as type parameters even though the
 * spec classifies them as data. Each entry preserves a narrowing form
 * (e.g. `NumberTypeNode<'u32'>`) that downstream code relies on.
 */
export const NARROWABLE_DATA_ATTRIBUTES: ReadonlySet<string> = new Set([
    'numberTypeNode:format',
    'stringTypeNode:encoding',
]);

/**
 * Per-node override of the type-parameter emission order. Each value
 * must enumerate exactly the set of attributes that surface as type
 * parameters for the node — no missing, no extras — otherwise both
 * generators throw at startup rather than silently drop or reorder
 * type parameters.
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
 * Mapping from spec category name to the output subdirectory each
 * generator emits its entities into (relative to `generated/`). The
 * empty string places `topLevel` entities at the root.
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
