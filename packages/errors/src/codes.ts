/**
 * Heavily inspired by @solana/errors.
 * @see https://github.com/solana-labs/solana-web3.js/blob/master/packages/errors
 *
 * ---
 *
 * WARNING:
 *   - Don't remove error codes
 *   - Don't change or reorder error codes.
 *
 * Good naming conventions:
 *   - Prefixing common errors — e.g. under the same package — can be a good way to namespace them.
 *   - Use consistent names — e.g. choose `PDA` or `PROGRAM_DERIVED_ADDRESS` and stick with it. Ensure your names are consistent with existing error codes. The decision might have been made for you.
 *   - Recommended prefixes and suffixes:
 *     - `MALFORMED_`: Some input was not constructed properly. E.g. `MALFORMED_BASE58_ENCODED_ADDRESS`.
 *     - `INVALID_`: Some input is invalid (other than because it was MALFORMED). E.g. `INVALID_NUMBER_OF_BYTES`.
 *     - `EXPECTED_`: Some input was different than expected, no need to specify the "GOT" part unless necessary. E.g. `EXPECTED_DECODED_ACCOUNT`.
 *     - `_CANNOT_`: Some operation cannot be performed or some input cannot be used due to some condition. E.g. `CANNOT_DECODE_EMPTY_BYTE_ARRAY` or `PDA_CANNOT_END_WITH_PDA_MARKER`.
 *     - `_MUST_BE_`: Some condition must be true. E.g. `NONCE_TRANSACTION_FIRST_INSTRUCTION_MUST_BE_ADVANCE_NONCE`.
 *     - `_FAILED_TO_`: Tried to perform some operation and failed. E.g. `FAILED_TO_DECODE_ACCOUNT`.
 *     - `_NOT_FOUND`: Some operation lead to not finding something. E.g. `ACCOUNT_NOT_FOUND`.
 *     - `_OUT_OF_RANGE`: Some value is out of range. E.g. `ENUM_DISCRIMINATOR_OUT_OF_RANGE`.
 *     - `_EXCEEDED`: Some limit was exceeded. E.g. `PDA_MAX_SEED_LENGTH_EXCEEDED`.
 *     - `_MISMATCH`: Some elements do not match. E.g. `ENCODER_DECODER_FIXED_SIZE_MISMATCH`.
 *     - `_MISSING`: Some required input is missing. E.g. `TRANSACTION_FEE_PAYER_MISSING`.
 *     - `_UNIMPLEMENTED`: Some required component is not available in the environment. E.g. `SUBTLE_CRYPTO_VERIFY_FUNCTION_UNIMPLEMENTED`.
 */
export const KINOBI_ERROR__UNRECOGNIZED_NODE_KIND = 1 as const;
export const KINOBI_ERROR__UNEXPECTED_NODE_KIND = 2 as const;
export const KINOBI_ERROR__UNEXPECTED_NESTED_NODE_KIND = 3 as const;
export const KINOBI_ERROR__LINKED_NODE_NOT_FOUND = 4 as const;
export const KINOBI_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE = 5 as const;
export const KINOBI_ERROR__VERSION_MISMATCH = 6 as const;

// Visitors-related errors.
// Reserve error codes in the range [1200000-1200999].
export const KINOBI_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES = 1200000 as const;
export const KINOBI_ERROR__VISITORS__INVALID_PDA_SEED_VALUES = 1200001 as const;
export const KINOBI_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES =
    1200002 as const;
export const KINOBI_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE = 1200003 as const;
export const KINOBI_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY = 1200004 as const;
export const KINOBI_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND = 1200005 as const;
export const KINOBI_ERROR__VISITORS__INVALID_NUMBER_WRAPPER = 1200006 as const;
export const KINOBI_ERROR__VISITORS__CANNOT_EXTEND_MISSING_VISIT_FUNCTION = 1200007 as const;
export const KINOBI_ERROR__VISITORS__FAILED_TO_VALIDATE_NODE = 1200008 as const;
export const KINOBI_ERROR__VISITORS__INSTRUCTION_ENUM_ARGUMENT_NOT_FOUND = 1200009 as const;
export const KINOBI_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES = 1200010 as const;
export const KINOBI_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND = 1200011 as const;

// Anchor-related errors.
// Reserve error codes in the range [2100000-2100999].
export const KINOBI_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE = 2100000 as const;
export const KINOBI_ERROR__ANCHOR__ACCOUNT_TYPE_MISSING = 2100001 as const;
export const KINOBI_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING = 2100002 as const;
export const KINOBI_ERROR__ANCHOR__TYPE_PATH_MISSING = 2100003 as const;
export const KINOBI_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED = 2100004 as const;

// Renderers-related errors.
// Reserve error codes in the range [2800000-2800999].
export const KINOBI_ERROR__RENDERERS__UNSUPPORTED_NODE = 2800000 as const;

/**
 * A union of every Codama error code
 *
 * You might be wondering why this is not a TypeScript enum or const enum.
 *
 * One of the goals of this library is to enable people to use some or none of it without having to
 * bundle all of it.
 *
 * If we made the set of error codes an enum then anyone who imported it (even if to only use a
 * single error code) would be forced to bundle every code and its label.
 *
 * Const enums appear to solve this problem by letting the compiler inline only the codes that are
 * actually used. Unfortunately exporting ambient (const) enums from a library like `@codama/errors`
 * is not safe, for a variety of reasons covered here: https://stackoverflow.com/a/28818850
 */
export type KinobiErrorCode =
    | typeof KINOBI_ERROR__ANCHOR__ACCOUNT_TYPE_MISSING
    | typeof KINOBI_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING
    | typeof KINOBI_ERROR__ANCHOR__SEED_KIND_UNIMPLEMENTED
    | typeof KINOBI_ERROR__ANCHOR__TYPE_PATH_MISSING
    | typeof KINOBI_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE
    | typeof KINOBI_ERROR__LINKED_NODE_NOT_FOUND
    | typeof KINOBI_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE
    | typeof KINOBI_ERROR__RENDERERS__UNSUPPORTED_NODE
    | typeof KINOBI_ERROR__UNEXPECTED_NESTED_NODE_KIND
    | typeof KINOBI_ERROR__UNEXPECTED_NODE_KIND
    | typeof KINOBI_ERROR__UNRECOGNIZED_NODE_KIND
    | typeof KINOBI_ERROR__VERSION_MISMATCH
    | typeof KINOBI_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND
    | typeof KINOBI_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES
    | typeof KINOBI_ERROR__VISITORS__CANNOT_EXTEND_MISSING_VISIT_FUNCTION
    | typeof KINOBI_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES
    | typeof KINOBI_ERROR__VISITORS__CANNOT_USE_OPTIONAL_ACCOUNT_AS_PDA_SEED_VALUE
    | typeof KINOBI_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES
    | typeof KINOBI_ERROR__VISITORS__FAILED_TO_VALIDATE_NODE
    | typeof KINOBI_ERROR__VISITORS__INSTRUCTION_ENUM_ARGUMENT_NOT_FOUND
    | typeof KINOBI_ERROR__VISITORS__INVALID_INSTRUCTION_DEFAULT_VALUE_DEPENDENCY
    | typeof KINOBI_ERROR__VISITORS__INVALID_NUMBER_WRAPPER
    | typeof KINOBI_ERROR__VISITORS__INVALID_PDA_SEED_VALUES
    | typeof KINOBI_ERROR__VISITORS__RENDER_MAP_KEY_NOT_FOUND;
