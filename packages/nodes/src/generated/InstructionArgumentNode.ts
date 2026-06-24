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

/** A named argument of an instruction, with its type and an optional default value. */
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
