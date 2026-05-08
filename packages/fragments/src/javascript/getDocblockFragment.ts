import type { Fragment } from './fragment';
import { fragment } from './fragment';

/**
 * Build a JSDoc-style docblock fragment from an array of lines.
 *
 * Empty or `undefined` input returns `undefined` so the helper composes
 * naturally with the {@link fragment} tag's optional-interpolation
 * behavior — a node's `docs` attribute can be threaded straight in
 * without a ternary guard:
 *
 * ```ts
 * fragment`${getDocblockFragment(node.docs)}\nexport interface X {}`;
 * ```
 *
 * Single-line input renders as a one-line block (`/** line *\/`);
 * multi-line input renders as a standard multi-line JSDoc block. Empty
 * elements in the array render as bare ` *` lines, useful for paragraph
 * breaks inside a docblock.
 *
 * The helper defangs any literal `*\/` sequences inside the lines (they are
 * rewritten as `*\\/`) so that user-supplied content cannot accidentally
 * close the docblock early.
 *
 * @param lines - The lines of the docblock, or `undefined`. Empty array
 * and `undefined` both return `undefined`.
 * @param options - Optional settings.
 * @param options.withLineJump - When `true`, appends a trailing `\n` after
 * the closing `*\/`. Useful when the docblock is followed by a same-line
 * item like an enum variant.
 * @return A {@link Fragment} carrying the rendered docblock, or `undefined`
 * when `lines` is empty or `undefined`.
 *
 * @example
 * ```ts
 * import { getDocblockFragment } from '@codama/fragments/javascript';
 *
 * getDocblockFragment(['Greets the user.'])?.content;
 * // /** Greets the user. *\/
 *
 * getDocblockFragment(['First line.', '', 'Second paragraph.'])?.content;
 * // /**
 * //  * First line.
 * //  *
 * //  * Second paragraph.
 * //  *\/
 *
 * getDocblockFragment(undefined);
 * // undefined
 * ```
 */
export function getDocblockFragment(
    lines: readonly string[] | undefined,
    options: { withLineJump?: boolean } = {},
): Fragment | undefined {
    if (!lines || lines.length === 0) return undefined;
    const lineJump = options.withLineJump ? '\n' : '';
    const safeLines = lines.map(defang);
    if (safeLines.length === 1) return fragment`/** ${safeLines[0]} */${lineJump}`;
    const prefixedLines = safeLines.map(line => (line ? ` * ${line}` : ' *'));
    return fragment`/**\n${prefixedLines.join('\n')}\n */${lineJump}`;
}

/** Escape any `*\/` sequences in a docblock line so user input can't close the comment. */
function defang(line: string): string {
    return line.replace(/\*\//g, '*\\/');
}
