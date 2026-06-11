import type { InstructionAccountNode, InstructionInputValueNode } from '@codama/node-types';
import { camelCase, DocsInput, parseDocs } from '../shared';

export type InstructionAccountNodeInput<
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
> = Omit<InstructionAccountNode<TDefaultValue>, 'docs' | 'kind' | 'name'> & {
    readonly name: string;
    readonly docs?: DocsInput;
};

/** An account participating in an instruction, with its name, signing/writability flags, and an optional default value. */
export function instructionAccountNode<const TDefaultValue extends InstructionInputValueNode | undefined = undefined>(
    input: InstructionAccountNodeInput<TDefaultValue>,
): InstructionAccountNode<TDefaultValue> {
    const parsedDocs = parseDocs(input.docs);
    return Object.freeze({
        kind: 'instructionAccountNode',

        // Data.
        name: camelCase(input.name),
        isWritable: input.isWritable,
        isSigner: input.isSigner,
        isOptional: input.isOptional ?? false,
        ...(parsedDocs.length > 0 && { docs: parsedDocs }),

        // Children.
        ...(input.defaultValue !== undefined && { defaultValue: input.defaultValue }),
    });
}
