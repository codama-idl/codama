import type {
    InstructionArgumentNode,
    InstructionInputValueNode,
    StructFieldDisplayNode,
    TypeNode,
} from '@codama/node-types';

import { camelCase, DocsInput, parseDocs } from '../shared';

export type InstructionArgumentNodeInput<
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
    TType extends TypeNode = TypeNode,
    TDisplay extends StructFieldDisplayNode | undefined = StructFieldDisplayNode | undefined,
> = Omit<InstructionArgumentNode<TDefaultValue, TType, TDisplay>, 'docs' | 'kind' | 'name'> & {
    readonly name: string;
    readonly docs?: DocsInput;
};

/**
 * A named argument of an instruction, with its type and an optional default value.
 * Serialised next to each other, the arguments of an instruction form its data.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/7e2def82-949a-4663-bdc3-ac599d39d2d2)
 */
export function instructionArgumentNode<
    const TDefaultValue extends InstructionInputValueNode | undefined = undefined,
    const TType extends TypeNode = TypeNode,
    const TDisplay extends StructFieldDisplayNode | undefined = undefined,
>(
    input: InstructionArgumentNodeInput<TDefaultValue, TType, TDisplay>,
): InstructionArgumentNode<TDefaultValue, TType, TDisplay> {
    const parsedDocs = parseDocs(input.docs);
    return Object.freeze({
        kind: 'instructionArgumentNode',

        // Data.
        name: camelCase(input.name),
        ...(input.defaultValueStrategy !== undefined && { defaultValueStrategy: input.defaultValueStrategy }),
        ...(parsedDocs.length > 0 && { docs: parsedDocs }),

        // Children.
        type: input.type,
        ...(input.defaultValue !== undefined && { defaultValue: input.defaultValue }),
        ...(input.display !== undefined && { display: input.display }),
    });
}
