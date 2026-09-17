import type { InstructionAccountDisplayNode, PluginNode, TextNode } from '@codama/node-types';

export type InstructionAccountDisplayNodeInput<
    TLabel extends string | TextNode | undefined = string | TextNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<InstructionAccountDisplayNode<TLabel, TPlugins>, 'kind'>;

/** Display metadata for an instruction account: its label in the fallback list and whether it is shown. */
export function instructionAccountDisplayNode<
    const TLabel extends string | TextNode | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(input: InstructionAccountDisplayNodeInput<TLabel, TPlugins>): InstructionAccountDisplayNode<TLabel, TPlugins> {
    return Object.freeze({
        kind: 'instructionAccountDisplayNode',

        // Data.
        ...(input.skip !== undefined && { skip: input.skip }),

        // Children.
        ...(input.label !== undefined && { label: input.label }),
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
