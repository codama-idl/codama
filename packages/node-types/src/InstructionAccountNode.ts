import type { InstructionInputValueNode } from './contextualValueNodes';
import type { MainCaseString } from './shared';

export interface InstructionAccountNode<
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
> {
    readonly kind: 'instructionAccountNode';

    // Data.
    readonly name: MainCaseString;
    readonly isWritable: boolean;
    readonly isSigner: boolean | 'either';
    readonly isOptional: boolean;
    readonly docs: string[];

    // Children.
    readonly defaultValue?: TDefaultValue;
}
