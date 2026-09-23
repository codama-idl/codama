import type { TextNode } from '@codama/node-types';

/**
 * Read the plain-string content of a `string | TextNode` value.
 *
 * `docs`, `instructionStatusNode.message`, display labels and intents are
 * all `string | TextNode` — a plain string or the rich {@link textNode}
 * arm. This returns the underlying text for either form.
 */
export function getTextNodeContent(value: string | TextNode): string {
    return typeof value === 'string' ? value : value.content;
}
