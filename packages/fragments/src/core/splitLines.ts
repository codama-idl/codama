/**
 * Split a docs item on its line breaks (`\r\n` or `\n`).
 *
 * A single trailing line break is ignored so that `'Hello.\n'` yields one
 * line rather than a trailing empty one. An empty item still yields a
 * single empty line, and further trailing line breaks are kept as empty
 * lines.
 *
 * This helper is internal to `@codama/fragments` and is intentionally not
 * re-exported from the core barrel.
 *
 * @param item - The docs item to split.
 * @return The lines of the item, without line break characters.
 *
 * @example
 * ```ts
 * splitLines('First.\r\nSecond.'); // ['First.', 'Second.']
 * splitLines('Hello.\n'); // ['Hello.']
 * splitLines('Hello.\n\n'); // ['Hello.', '']
 * splitLines(''); // ['']
 * ```
 */
export function splitLines(item: string): string[] {
    return item.replace(/\r?\n$/, '').split(/\r?\n/);
}
