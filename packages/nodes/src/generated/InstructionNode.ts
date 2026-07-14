import type {
    DiscriminatorNode,
    InstructionAccountNode,
    InstructionArgumentNode,
    InstructionByteDeltaNode,
    InstructionDisplayNode,
    InstructionNode,
    InstructionRemainingAccountsNode,
    InstructionStatusNode,
    PluginNode,
    ProvidedNode,
} from '@codama/node-types';
import { camelCase, DocsInput, parseDocs } from '../shared';

export type InstructionNodeInput<
    TAccounts extends Array<InstructionAccountNode> = Array<InstructionAccountNode>,
    TArguments extends Array<InstructionArgumentNode> = Array<InstructionArgumentNode>,
    TExtraArguments extends Array<InstructionArgumentNode> | undefined = Array<InstructionArgumentNode> | undefined,
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
            TAccounts,
            TArguments,
            TExtraArguments,
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
    'docs' | 'kind' | 'name'
> & {
    readonly name: string;
    readonly docs?: DocsInput;
};

/** A program instruction: its accounts, arguments, byte-delta hints, discriminators, optional status, and optional sub-instructions. */
export function instructionNode<
    const TAccounts extends Array<InstructionAccountNode> = [],
    const TArguments extends Array<InstructionArgumentNode> = [],
    const TExtraArguments extends Array<InstructionArgumentNode> | undefined = undefined,
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
        TAccounts,
        TArguments,
        TExtraArguments,
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
    TAccounts,
    TArguments,
    TExtraArguments,
    TRemainingAccounts,
    TByteDeltas,
    TDiscriminators,
    TSubInstructions,
    TStatus,
    TProvides,
    TDisplay,
    TPlugins
> {
    const parsedDocs = parseDocs(input.docs);
    return Object.freeze({
        kind: 'instructionNode',

        // Data.
        name: camelCase(input.name),
        ...(parsedDocs.length > 0 && { docs: parsedDocs }),
        optionalAccountStrategy: input.optionalAccountStrategy ?? 'programId',

        // Children.
        accounts: (input.accounts ?? []) as TAccounts,
        arguments: (input.arguments ?? []) as TArguments,
        ...(input.extraArguments !== undefined && { extraArguments: input.extraArguments }),
        ...(input.remainingAccounts !== undefined && { remainingAccounts: input.remainingAccounts }),
        ...(input.byteDeltas !== undefined && { byteDeltas: input.byteDeltas }),
        ...(input.discriminators !== undefined && { discriminators: input.discriminators }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.subInstructions !== undefined && { subInstructions: input.subInstructions }),
        ...(input.provides !== undefined && { provides: input.provides }),
        ...(input.display !== undefined && { display: input.display }),
        ...(input.plugins !== undefined && { plugins: input.plugins }),
    });
}
