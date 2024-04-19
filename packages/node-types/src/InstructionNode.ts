import type { DiscriminatorNode } from './discriminatorNodes';
import type { InstructionAccountNode } from './InstructionAccountNode';
import type { InstructionArgumentNode } from './InstructionArgumentNode';
import type { InstructionByteDeltaNode } from './InstructionByteDeltaNode';
import type { InstructionRemainingAccountsNode } from './InstructionRemainingAccountsNode';
import type { MainCaseString } from './shared';

type SubInstructionNode = InstructionNode;

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
    readonly name: MainCaseString;
    readonly docs: string[];
    readonly optionalAccountStrategy: 'omitted' | 'programId';

    // Children.
    readonly accounts: TAccounts;
    readonly arguments: TArguments;
    readonly extraArguments?: TExtraArguments;
    readonly remainingAccounts?: TRemainingAccounts;
    readonly byteDeltas?: TByteDeltas;
    readonly discriminators?: TDiscriminators;
    readonly subInstructions?: TSubInstructions;
}
