import type { Fragment } from './fragment';
import { fragment } from './fragment';

/**
 * Build a Rust doc-comment fragment from an array of lines.
 *
 * Empty or `undefined` input returns `undefined` so the helper composes
 * naturally with the {@link fragment} tag's optional-interpolation
 * behavior — a node's `docs` attribute can be threaded straight in
 * without a ternary guard:
 *
 * ```ts
 * fragment`${getDocblockFragment(node.docs)}\npub struct X;`;
 * ```
 *
 * Each line is prefixed with `///` (outer doc) by default, or `//!`
 * (inner doc) when `internal` is `true`. Empty elements in the array
 * render as a bare prefix line (`///` or `//!` with no trailing space),
 * useful for paragraph breaks inside a doc comment.
 *
 * @param lines - The lines of the doc comment, or `undefined`. Empty
 * array and `undefined` both return `undefined`.
 * @param options - Optional settings.
 * @param options.internal - When `true`, emit inner doc comments (`//!`)
 * instead of outer doc comments (`///`). Useful for module- or crate-level
 * documentation.
 * @param options.withLineJump - When `true`, appends a trailing `\n` after
 * the last line.
 * @return A {@link Fragment} carrying the rendered doc comment, or
 * `undefined` when `lines` is empty or `undefined`.
 *
 * @example
 * ```ts
 * import { getDocblockFragment } from '@codama/fragments/rust';
 *
 * getDocblockFragment(['Greets the user.'])?.content;
 * // /// Greets the user.
 *
 * getDocblockFragment(['First line.', '', 'Second paragraph.'])?.content;
 * // /// First line.
 * // ///
 * // /// Second paragraph.
 *
 * getDocblockFragment(['Module docs.'], { internal: true })?.content;
 * // //! Module docs.
 *
 * getDocblockFragment(undefined);
 * // undefined
 * ```
 */
export function getDocblockFragment(
    lines: readonly string[] | undefined,
    options: { internal?: boolean; withLineJump?: boolean } = {},
): Fragment | undefined {
    if (!lines || lines.length === 0) return undefined;
    const prefix = options.internal ? '//!' : '///';
    const lineJump = options.withLineJump ? '\n' : '';
    const prefixedLines = lines.map(line => (line ? `${prefix} ${line}` : prefix));
    return fragment`${prefixedLines.join('\n')}${lineJump}`;
}
