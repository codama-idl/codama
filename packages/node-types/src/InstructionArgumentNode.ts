import type { InstructionInputValueNode } from './contextualValueNodes';
import type { CamelCaseString, Docs } from './shared';
import type { TypeNode } from './typeNodes';

export interface InstructionArgumentNode<
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
> {
    readonly kind: 'instructionArgumentNode';

    // Data.
    readonly name: CamelCaseString;
    readonly defaultValueStrategy?: 'omitted' | 'optional';
    readonly docs?: Docs;

    // Children.
    readonly type: TypeNode;
    readonly defaultValue?: TDefaultValue;
}
