import type { InstructionAccountNode, InstructionInputValueNode } from '@codama/node-types';

import { camelCase, DocsInput, parseDocs } from './shared';

export type InstructionAccountNodeInput<
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
> = Omit<InstructionAccountNode<TDefaultValue>, 'docs' | 'isOptional' | 'kind' | 'name'> & {
    readonly docs?: DocsInput;
    readonly isOptional?: boolean;
    readonly name: string;
};

export function instructionAccountNode<TDefaultValue extends InstructionInputValueNode | undefined = undefined>(
    input: InstructionAccountNodeInput<TDefaultValue>,
): InstructionAccountNode<TDefaultValue> {
    return Object.freeze({
        kind: 'instructionAccountNode',

        // Data.
        name: camelCase(input.name),
        isWritable: input.isWritable,
        isSigner: input.isSigner,
        isOptional: input.isOptional ?? false,
        docs: parseDocs(input.docs),

        // Children.
        ...(input.defaultValue !== undefined && { defaultValue: input.defaultValue }),
    });
}
