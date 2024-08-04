import type { InstructionInputValueNode } from '../contextualValueNodes';
import { InstructionArgumentLinkNode } from '../linkNodes';
import type { CamelCaseString, ImportFrom } from '../shared';

export interface InstructionArgumentOverrideNode<
    TArguments extends InstructionArgumentLinkNode[] = InstructionArgumentLinkNode[],
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined
> {
    readonly kind: 'instructionArgumentOverrideNode';

    // Data.
    readonly name: CamelCaseString;
    readonly replace?: TArguments;
    readonly defaultValue?: TDefaultValue;
    readonly importFrom?: ImportFrom;
}
