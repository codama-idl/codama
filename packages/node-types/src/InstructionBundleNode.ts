import { InstructionLinkNode } from './linkNodes';
import { OverrideNode } from './overrideNodes';
import type { CamelCaseString } from './shared';

export interface InstructionBundleNode<
    TInstructions extends InstructionLinkNode[] = InstructionLinkNode[],
    TOverrides extends OverrideNode[] | undefined = OverrideNode[] | undefined,
> {
    readonly kind: 'instructionBundleNode';

    // Data.
    readonly name: CamelCaseString;

    // Children.
    readonly instructions: TInstructions;
    readonly override?: TOverrides;
}
