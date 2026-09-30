import { CODAMA_ERROR__INVALID_BRANDED_STRING, CodamaError } from '@codama/errors';
import type { DecimalString, IdentifierString, IntegerString, NamespaceString, PathString } from '@codama/node-types';

/**
 * Runtime validators for the spec's branded-string constraints.
 *
 * Node factories accept plain `string` for convenience and brand the
 * value through one of these helpers, which assert the constraint's
 * grammar and throw {@link CODAMA_ERROR__INVALID_BRANDED_STRING} on a
 * malformed value rather than silently producing an invalid tree. The
 * grammars mirror the `StringConstraint` definitions in `@codama/spec`.
 */

/** `[A-Za-z_][A-Za-z0-9_]*` — no casing mandated, no leading digit. */
const IDENTIFIER_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;
/** `identifier ("." identifier)*` — dot-separated identifiers, no empty segments. */
const NAMESPACE_REGEX = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/;
/** `first ( "." identifier | "[" integer "]" )*` where `first := identifier | "[" integer "]"`. */
const PATH_REGEX =
    /^(?:[A-Za-z_][A-Za-z0-9_]*|\[(?:0|[1-9][0-9]*)\])(?:\.[A-Za-z_][A-Za-z0-9_]*|\[(?:0|[1-9][0-9]*)\])*$/;
/** `0|-?[1-9][0-9]*` — no leading zeros, no negative zero. */
const INTEGER_REGEX = /^(?:0|-?[1-9][0-9]*)$/;
/** `-?(0|[1-9][0-9]*)("." [0-9]*[1-9])?` plus the specials `NaN`/`Infinity`/`-Infinity`. */
const DECIMAL_REGEX = /^(?:NaN|-?Infinity|-?(?:0|[1-9][0-9]*)(?:\.[0-9]*[1-9])?)$/;

function assertMatches<T extends string>(value: string, regex: RegExp, expected: string): T {
    if (!regex.test(value)) {
        throw new CodamaError(CODAMA_ERROR__INVALID_BRANDED_STRING, { actual: value, expected });
    }
    return value as T;
}

/**
 * Validate and brand a Codama identifier (`[A-Za-z_][A-Za-z0-9_]*`).
 *
 * v2 identifiers preserve their casing — `transferTokens`,
 * `transfer_tokens` and `TransferTokens` are all valid; uniqueness within
 * a scope is resolved by case-folding, not enforced here.
 */
export function identifierString(value: string): IdentifierString {
    return assertMatches(value, IDENTIFIER_REGEX, 'identifier (letters, digits and underscores; no leading digit)');
}

/** Validate and brand a namespace (`identifier ("." identifier)*`). */
export function namespaceString(value: string): NamespaceString {
    return assertMatches(value, NAMESPACE_REGEX, 'namespace (dot-separated identifiers)');
}

/** Validate and brand a path expression (`first ( "." identifier | "[" integer "]" )*`). */
export function pathString(value: string): PathString {
    return assertMatches(value, PATH_REGEX, 'path (e.g. "data.amount" or "[0].field")');
}

/** Validate and brand a base-10 integer string (`0|-?[1-9][0-9]*`). */
export function integerString(value: string): IntegerString {
    return assertMatches(value, INTEGER_REGEX, 'integer (base-10, no leading zeros)');
}

/** Validate and brand a canonical decimal string (`-?(0|[1-9][0-9]*)("." [0-9]*[1-9])?` or a special). */
export function decimalString(value: string): DecimalString {
    return assertMatches(value, DECIMAL_REGEX, 'decimal (or "NaN"/"Infinity"/"-Infinity")');
}
