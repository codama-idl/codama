import type {
    AccountLinkNode,
    InstructionAccountDisplayNode,
    InstructionAccountNode,
    InstructionInputValueNode,
    PluginNode,
    TextNode,
} from '@codama/node-types';

import { identifierString } from '../shared';

export type InstructionAccountNodeInput<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TDefaultValue extends InstructionInputValueNode | undefined = InstructionInputValueNode | undefined,
    TAccountLink extends AccountLinkNode | undefined = AccountLinkNode | undefined,
    TDisplay extends InstructionAccountDisplayNode | undefined = InstructionAccountDisplayNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<InstructionAccountNode<TDocs, TDefaultValue, TAccountLink, TDisplay, TPlugins>, 'identifier' | 'kind'> & {
    readonly identifier: string;
};

/**
 * An account participating in an instruction, with its identifier, signing/writability flags, and an optional default value.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/4656a08b-2f89-49c2-b428-5378cb1a0b9e)
 */
export function instructionAccountNode<
    const TDocs extends string | TextNode | undefined = undefined,
    const TDefaultValue extends InstructionInputValueNode | undefined = undefined,
    const TAccountLink extends AccountLinkNode | undefined = undefined,
    const TDisplay extends InstructionAccountDisplayNode | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    input: InstructionAccountNodeInput<TDocs, TDefaultValue, TAccountLink, TDisplay, TPlugins>,
): InstructionAccountNode<TDocs, TDefaultValue, TAccountLink, TDisplay, TPlugins> {
    return Object.freeze({
        kind: 'instructionAccountNode',

        // Data.
        identifier: identifierString(input.identifier),
        isWritable: input.isWritable,
        isSigner: input.isSigner,
        isOptional: input.isOptional ?? false,

        // Children.
        ...(input.docs !== undefined && { docs: input.docs }),
        ...(input.defaultValue !== undefined && { defaultValue: input.defaultValue }),
        ...(input.accountLink !== undefined && { accountLink: input.accountLink }),
        ...(input.display !== undefined && { display: input.display }),
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
