import type { DiscriminatorNode } from './discriminatorNodes';
import type { InstructionAccountNode } from './InstructionAccountNode';
import type { InstructionArgumentNode } from './InstructionArgumentNode';
import type { InstructionByteDeltaNode } from './InstructionByteDeltaNode';
import type { InstructionRemainingAccountsNode } from './InstructionRemainingAccountsNode';
import type { CamelCaseString, Docs } from './shared';

type SubInstructionNode = InstructionNode;

export type OptionalAccountStrategy = 'omitted' | 'programId';

export interface InstructionNode<
    TAccounts extends InstructionAccountNode[] = InstructionAccountNode[],
    TArguments extends InstructionArgumentNode[] = InstructionArgumentNode[],
    TExtraArguments extends InstructionArgumentNode[] | undefined = InstructionArgumentNode[] | undefined,
    TRemainingAccounts extends InstructionRemainingAccountsNode[] | undefined =
        | InstructionRemainingAccountsNode[]
        | undefined,
    TByteDeltas extends InstructionByteDeltaNode[] | undefined = InstructionByteDeltaNode[] | undefined,
    TDiscriminators extends DiscriminatorNode[] | undefined = DiscriminatorNode[] | undefined,
    TSubInstructions extends SubInstructionNode[] | undefined = SubInstructionNode[] | undefined,
> {
    readonly kind: 'instructionNode';

    // Data.
    readonly name: CamelCaseString;
    readonly docs?: Docs;
    readonly optionalAccountStrategy?: OptionalAccountStrategy;

    // Children.
    readonly accounts: TAccounts;
    readonly arguments: TArguments;
    readonly extraArguments?: TExtraArguments;
    readonly remainingAccounts?: TRemainingAccounts;
    readonly byteDeltas?: TByteDeltas;
    readonly discriminators?: TDiscriminators;
    readonly subInstructions?: TSubInstructions;
}
