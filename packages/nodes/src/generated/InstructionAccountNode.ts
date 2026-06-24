import type {
    AccountLinkNode,
    InstructionAccountDisplayNode,
    InstructionAccountNode,
    InstructionInputValueNode,
} from '@codama/node-types';
import { camelCase, DocsInput, parseDocs } from '../shared';

export type InstructionAccountNodeInput<
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
    TAccountLink extends AccountLinkNode | undefined = AccountLinkNode | undefined,
    TDisplay extends InstructionAccountDisplayNode | undefined = InstructionAccountDisplayNode | undefined,
> = Omit<InstructionAccountNode<TDefaultValue, TAccountLink, TDisplay>, 'docs' | 'kind' | 'name'> & {
    readonly name: string;
    readonly docs?: DocsInput;
};

/** An account participating in an instruction, with its name, signing/writability flags, and an optional default value. */
export function instructionAccountNode<
    const TDefaultValue extends InstructionInputValueNode | undefined = undefined,
    const TAccountLink extends AccountLinkNode | undefined = undefined,
    const TDisplay extends InstructionAccountDisplayNode | undefined = undefined,
>(
    input: InstructionAccountNodeInput<TDefaultValue, TAccountLink, TDisplay>,
): InstructionAccountNode<TDefaultValue, TAccountLink, TDisplay> {
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
        ...(input.accountLink !== undefined && { accountLink: input.accountLink }),
        ...(input.display !== undefined && { display: input.display }),
    });
}
