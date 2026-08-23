import type { CamelCaseString } from '../brands';
import type { Docs } from '../Docs';
import type { InstructionInputValueNode } from './contextualValueNodes/InstructionInputValueNode';
import type { StructFieldDisplayNode } from './displayNodes/StructFieldDisplayNode';
import type { DefaultValueStrategy } from './shared/defaultValueStrategy';
import type { TypeNode } from './typeNodes/TypeNode';

/**
 * A named argument of an instruction, with its type and an optional default value.
 * Serialised next to each other, the arguments of an instruction form its data.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/7e2def82-949a-4663-bdc3-ac599d39d2d2)
 */
export interface InstructionArgumentNode<
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
    TType extends TypeNode = TypeNode,
    TDisplay extends StructFieldDisplayNode | undefined = StructFieldDisplayNode | undefined,
> {
    readonly kind: 'instructionArgumentNode';

    // Data.
    /** The name of the argument. */
    readonly name: CamelCaseString;
    /**
     * How a configured default value is exposed in generated APIs.
     * Only relevant when `defaultValue` is set; when absent, `optional` is assumed.
     */
    readonly defaultValueStrategy?: DefaultValueStrategy;
    /** Markdown documentation for the argument. */
    readonly docs?: Docs;

    // Children.
    /** The type of the argument. */
    readonly type: TType;
    /** A default value used when the argument is omitted by callers. */
    readonly defaultValue?: TDefaultValue;
    /** Display metadata describing how the argument is presented. */
    readonly display?: TDisplay;
}
