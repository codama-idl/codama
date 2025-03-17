import type { InstructionInputValueNode } from './contextualValueNodes';
import type { CamelCaseString, Docs } from './shared';

export interface InstructionAccountNode<
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
> {
    readonly kind: 'instructionAccountNode';

    // Data.
    readonly name: CamelCaseString;
    readonly isWritable: boolean;
    readonly isSigner: boolean | 'either';
    readonly isOptional?: boolean;
    readonly docs?: Docs;

    // Children.
    readonly defaultValue?: TDefaultValue;
}
