/**
 * Hand-written branded string types used throughout the generated
 * node-type surface to mark strings that must conform to a specific
 * spec constraint (identifiers, namespaces, path expressions,
 * string-encoded numbers).
 *
 * These types live outside `./generated/` because they're static — they
 * never change with the spec — so there's nothing to regenerate. The
 * generator's symbol map points at this file when emitting `import type
 * { IdentifierString } from '../brands';` lines.
 *
 * The brand is purely a TypeScript marker; runtime parsing and
 * validation happen wherever branded strings cross the package
 * boundary.
 */

/**
 * A string asserted to be a Codama identifier: `[A-Za-z_][A-Za-z0-9_]*`.
 * No casing is mandated — `transferTokens`, `transfer_tokens` and
 * `TransferTokens` are all valid — but identifiers sharing a scope must
 * not have the same camelCase form (the spec's casing-collision rule).
 */
export type IdentifierString = string & {
    readonly ['__string:codama']: 'identifier';
};

/**
 * A string asserted to be a namespace: a chain of identifiers separated
 * by single dots (`identifier ("." identifier)*`). Used for plugin
 * namespaces.
 */
export type NamespaceString = string & {
    readonly ['__string:codama']: 'namespace';
};

/**
 * A string asserted to be a path expression pointing into nested data
 * (`first ( "." identifier | "[" integer "]" )*`).
 */
export type PathString = string & {
    readonly ['__string:codama']: 'path';
};

/**
 * A string asserted to be a base-10 integer (`0|-?[1-9][0-9]*`). String
 * storage keeps the full 64- and 128-bit ranges lossless through JSON.
 */
export type IntegerString = string & {
    readonly ['__string:codama']: 'integer';
};

/**
 * A string asserted to be a canonical decimal number
 * (`-?(0|[1-9][0-9]*)("." [0-9]*[1-9])?`, or `NaN`/`Infinity`/`-Infinity`).
 * String storage makes float round-trips deterministic across serialisers.
 */
export type DecimalString = string & {
    readonly ['__string:codama']: 'decimal';
};
