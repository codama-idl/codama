import type { InstructionArgumentNode, InstructionInputValueNode, TypeNode } from '@codama/node-types';
import { camelCase, DocsInput, parseDocs } from '../shared';

export type InstructionArgumentNodeInput<
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
    TType extends TypeNode = TypeNode,
> = Omit<InstructionArgumentNode<TDefaultValue, TType>, 'docs' | 'kind' | 'name'> & {
    readonly name: string;
    readonly docs?: DocsInput;
};

/** A named argument of an instruction, with its type and an optional default value. */
export function instructionArgumentNode<
    const TDefaultValue extends InstructionInputValueNode | undefined = undefined,
    const TType extends TypeNode = TypeNode,
>(input: InstructionArgumentNodeInput<TDefaultValue, TType>): InstructionArgumentNode<TDefaultValue, TType> {
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
    });
}
