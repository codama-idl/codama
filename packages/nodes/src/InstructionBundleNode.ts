import type {
    InstructionBundleNode,
    InstructionLinkNode,
    OverrideNode
} from '@kinobi-so/node-types';

import { camelCase } from './shared';

export type InstructionBundleNodeInput<
    TInstructions extends InstructionLinkNode[] = InstructionLinkNode[],
    TOverrides extends OverrideNode[] | undefined = OverrideNode[] | undefined,
> = Omit<Partial<InstructionBundleNode<TInstructions, TOverrides>>, 'kind' | 'name'> & { readonly name: string; };

export function instructionBundleNode<
    TInstructions extends InstructionLinkNode[] = InstructionLinkNode[],
    TOverrides extends OverrideNode[] | undefined = OverrideNode[] | undefined,
>(
    input: InstructionBundleNodeInput<TInstructions, TOverrides>,
): InstructionBundleNode<TInstructions, TOverrides> {
    return Object.freeze({
        kind: 'instructionBundleNode',

        // Data.
        name: camelCase(input.name),

        // Children.
        instructions: (input.instructions ?? []) as TInstructions,
        ...(input.override !== undefined && { override: input.override as TOverrides }),
    });
}