import type { InstructionInputValueNode } from './contextualValueNodes';
import type { MainCaseString } from './shared';
import type { TypeNode } from './typeNodes';

export interface InstructionArgumentNode<
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
> {
    readonly kind: 'instructionArgumentNode';

    // Data.
    readonly name: MainCaseString;
    readonly docs: string[];
    readonly defaultValueStrategy?: 'omitted' | 'optional';

    // Children.
    readonly type: TypeNode;
    readonly defaultValue?: TDefaultValue;
}
