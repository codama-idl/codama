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
    TAccounts extends Array<InstructionAccountNode> | undefined = Array<InstructionAccountNode> | undefined,
    TArguments extends Array<InstructionArgumentNode> | undefined = Array<InstructionArgumentNode> | undefined,
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
    const TAccounts extends Array<InstructionAccountNode> | undefined = [],
    const TArguments extends Array<InstructionArgumentNode> | undefined = [],
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
        ...(input.accounts !== undefined && input.accounts.length > 0 && { accounts: input.accounts as TAccounts }),
        ...(input.arguments !== undefined &&
            input.arguments.length > 0 && { arguments: input.arguments as TArguments }),
        ...(input.extraArguments !== undefined &&
            input.extraArguments.length > 0 && { extraArguments: input.extraArguments as TExtraArguments }),
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
