import type {
    DiscriminatorNode,
    InstructionAccountNode,
    InstructionByteDeltaNode,
    InstructionDisplayNode,
    InstructionNode,
    InstructionRemainingAccountsNode,
    InstructionStatusNode,
    PluginNode,
    ProvidedNode,
    TextNode,
    TypeNode,
} from '@codama/node-types';

import { identifierString } from '../shared';

export type InstructionNodeInput<
    TDocs extends string | TextNode | undefined = string | TextNode | undefined,
    TAccounts extends Array<InstructionAccountNode> | undefined = Array<InstructionAccountNode> | undefined,
    TData extends TypeNode | undefined = TypeNode | undefined,
    TRemainingAccounts extends Array<InstructionRemainingAccountsNode> | undefined =
        | Array<InstructionRemainingAccountsNode>
        | undefined,
    TByteDeltas extends Array<InstructionByteDeltaNode> | undefined = Array<InstructionByteDeltaNode> | undefined,
    TDiscriminators extends Array<DiscriminatorNode> | undefined = Array<DiscriminatorNode> | undefined,
    TSubInstructions extends Array<InstructionNode> | undefined = Array<InstructionNode> | undefined,
    TStatus extends InstructionStatusNode | undefined = InstructionStatusNode | undefined,
    TProvides extends Array<ProvidedNode> | undefined = Array<ProvidedNode> | undefined,
    TDisplay extends InstructionDisplayNode | undefined = InstructionDisplayNode | undefined,
    TPlugins extends Array<PluginNode> | undefined = Array<PluginNode> | undefined,
> = Omit<
    Partial<
        InstructionNode<
            TDocs,
            TAccounts,
            TData,
            TRemainingAccounts,
            TByteDeltas,
            TDiscriminators,
            TSubInstructions,
            TStatus,
            TProvides,
            TDisplay,
            TPlugins
        >
    >,
    'identifier' | 'kind'
> & {
    readonly identifier: string;
};

/**
 * A program instruction: its accounts, data, byte-delta hints, discriminators, optional status, and optional sub-instructions.
 *
 * ![Diagram](https://github.com/codama-idl/codama/assets/3642397/0d8edced-cfa4-4500-b80c-ebc56181a338)
 */
export function instructionNode<
    const TDocs extends string | TextNode | undefined = undefined,
    const TAccounts extends Array<InstructionAccountNode> | undefined = [],
    const TData extends TypeNode | undefined = undefined,
    const TRemainingAccounts extends Array<InstructionRemainingAccountsNode> | undefined = undefined,
    const TByteDeltas extends Array<InstructionByteDeltaNode> | undefined = undefined,
    const TDiscriminators extends Array<DiscriminatorNode> | undefined = undefined,
    const TSubInstructions extends Array<InstructionNode> | undefined = undefined,
    const TStatus extends InstructionStatusNode | undefined = undefined,
    const TProvides extends Array<ProvidedNode> | undefined = undefined,
    const TDisplay extends InstructionDisplayNode | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    input: InstructionNodeInput<
        TDocs,
        TAccounts,
        TData,
        TRemainingAccounts,
        TByteDeltas,
        TDiscriminators,
        TSubInstructions,
        TStatus,
        TProvides,
        TDisplay,
        TPlugins
    >,
): InstructionNode<
    TDocs,
    TAccounts,
    TData,
    TRemainingAccounts,
    TByteDeltas,
    TDiscriminators,
    TSubInstructions,
    TStatus,
    TProvides,
    TDisplay,
    TPlugins
> {
    return Object.freeze({
        kind: 'instructionNode',

        // Data.
        identifier: identifierString(input.identifier),
        optionalAccountStrategy: input.optionalAccountStrategy ?? 'programId',

        // Children.
        ...(input.docs !== undefined && { docs: input.docs }),
        ...(input.accounts !== undefined && input.accounts.length > 0 && { accounts: input.accounts as TAccounts }),
        ...(input.data !== undefined && { data: input.data }),
        ...(input.remainingAccounts !== undefined &&
            input.remainingAccounts.length > 0 && { remainingAccounts: input.remainingAccounts as TRemainingAccounts }),
        ...(input.byteDeltas !== undefined &&
            input.byteDeltas.length > 0 && { byteDeltas: input.byteDeltas as TByteDeltas }),
        ...(input.discriminators !== undefined &&
            input.discriminators.length > 0 && { discriminators: input.discriminators as TDiscriminators }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.subInstructions !== undefined &&
            input.subInstructions.length > 0 && { subInstructions: input.subInstructions as TSubInstructions }),
        ...(input.provides !== undefined && input.provides.length > 0 && { provides: input.provides as TProvides }),
        ...(input.display !== undefined && { display: input.display }),
        ...(input.plugins !== undefined && input.plugins.length > 0 && { plugins: input.plugins as TPlugins }),
    });
}
