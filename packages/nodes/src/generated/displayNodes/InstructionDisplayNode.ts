import type { InstructionDisplayNode, PluginNode, TextNode } from '@codama/node-types';

export type InstructionDisplayNodeInput<
    TIntent extends string | TextNode | undefined = string | TextNode | undefined,
    TInterpolatedIntent extends string | TextNode | undefined = string | TextNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<InstructionDisplayNode<TIntent, TInterpolatedIntent, TPlugins>, 'kind'>;

/**
 * Display metadata for an instruction: a short intent label and an interpolated sentence template.
 * Either form may be absent; presentation strategy is left to the renderer.
 */
export function instructionDisplayNode<
    const TIntent extends string | TextNode | undefined = undefined,
    const TInterpolatedIntent extends string | TextNode | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    input: InstructionDisplayNodeInput<TIntent, TInterpolatedIntent, TPlugins>,
): InstructionDisplayNode<TIntent, TInterpolatedIntent, TPlugins> {
    return Object.freeze({
        kind: 'instructionDisplayNode',

        // Children.
        ...(input.intent !== undefined && { intent: input.intent }),
        ...(input.interpolatedIntent !== undefined && { interpolatedIntent: input.interpolatedIntent }),
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
