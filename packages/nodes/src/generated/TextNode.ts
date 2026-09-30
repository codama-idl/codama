import type { PluginNode, TextNode } from '@codama/node-types';

export type TextNodeInput<TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined> = Omit<
    TextNode<TPlugins>,
    'kind'
>;

/**
 * A piece of human-facing text carrying structured metadata — the rich arm of the `string | textNode` union used by `docs`, display intents, labels and messages.
 * Being a node, it takes `plugins` like any other, which is how text metadata attaches without further spec changes — e.g. translations under the `i18n.*` namespace convention, where each payload is the translated content.
 * The canonical form of plugin-free text is the plain string: a `textNode` without plugins is valid but non-canonical, which validators flag as a lint. The tree always holds exactly what the JSON says.
 * Multi-line text uses `\n` within `content`. Text attributes are single-line by convention unless their own docs say otherwise; `docs` and `instructionStatusNode.message` may span multiple lines.
 */
export function textNode<const TPlugins extends Array<PluginNode> | undefined = undefined>(
    input: TextNodeInput<TPlugins>,
): TextNode<TPlugins> {
    return Object.freeze({
        kind: 'textNode',

        // Data.
        content: input.content,

        // Children.
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
