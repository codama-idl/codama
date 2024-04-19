import type { AccountNode } from './AccountNode';
import type { DefinedTypeNode } from './DefinedTypeNode';
import type { ErrorNode } from './ErrorNode';
import type { InstructionNode } from './InstructionNode';
import type { PdaNode } from './PdaNode';
import type { MainCaseString, ProgramVersion } from './shared';

export interface ProgramNode<
    TPdas extends PdaNode[] = PdaNode[],
    TAccounts extends AccountNode[] = AccountNode[],
    TInstructions extends InstructionNode[] = InstructionNode[],
    TDefinedTypes extends DefinedTypeNode[] = DefinedTypeNode[],
    TErrors extends ErrorNode[] = ErrorNode[],
> {
    readonly kind: 'programNode';

    // Data.
    readonly name: MainCaseString;
    readonly prefix: MainCaseString;
    readonly publicKey: string;
    readonly version: ProgramVersion;
    readonly origin?: 'anchor' | 'shank';

    // Children.
    readonly accounts: TAccounts;
    readonly instructions: TInstructions;
    readonly definedTypes: TDefinedTypes;
    readonly pdas: TPdas;
    readonly errors: TErrors;
}
