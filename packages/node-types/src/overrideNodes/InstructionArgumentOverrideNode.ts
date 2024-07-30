import type { InstructionInputValueNode } from '../contextualValueNodes';
import { InstructionArgumentLinkNode, InstructionLinkNode } from '../linkNodes';
import type { CamelCaseString, ImportFrom } from '../shared';

export interface InstructionArgumentOverrideNode<
    TInstruction extends InstructionLinkNode = InstructionLinkNode,
    TArguments extends InstructionArgumentLinkNode[] = InstructionArgumentLinkNode[],
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined
> {
    readonly kind: 'instructionArgumentOverrideNode';

    // Data.
    readonly name: CamelCaseString;
    readonly instruction: TInstruction;
    readonly replace?: TArguments;
    readonly defaultValue?: TDefaultValue;
    readonly importFrom?: ImportFrom;
}
