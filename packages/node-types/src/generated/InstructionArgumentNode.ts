import type { CamelCaseString } from '../brands';
import type { Docs } from '../Docs';
import type { InstructionInputValueNode } from './contextualValueNodes/InstructionInputValueNode';
import type { DefaultValueStrategy } from './shared/defaultValueStrategy';
import type { TypeNode } from './typeNodes/TypeNode';

/** A named argument of an instruction, with its type and an optional default value. */
export interface InstructionArgumentNode<
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
    TType extends TypeNode = TypeNode,
> {
    readonly kind: 'instructionArgumentNode';

    // Data.
    /** The name of the argument. */
    readonly name: CamelCaseString;
    /** How a configured default value is exposed in generated APIs. Required when `defaultValue` is set. */
    readonly defaultValueStrategy?: DefaultValueStrategy;
    /** Markdown documentation for the argument. */
    readonly docs?: Docs;

    // Children.
    /** The type of the argument. */
    readonly type: TType;
    /** A default value used when the argument is omitted by callers. */
    readonly defaultValue?: TDefaultValue;
}
