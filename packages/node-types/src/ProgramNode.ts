import type { AccountNode } from './AccountNode';
import type { DefinedTypeNode } from './DefinedTypeNode';
import type { ErrorNode } from './ErrorNode';
import { InstructionBundleNode } from './InstructionBundleNode';
import type { InstructionNode } from './InstructionNode';
import type { PdaNode } from './PdaNode';
import type { CamelCaseString, Docs, ProgramVersion } from './shared';

export interface ProgramNode<
    TPdas extends PdaNode[] = PdaNode[],
    TAccounts extends AccountNode[] = AccountNode[],
    TInstructions extends InstructionNode[] = InstructionNode[],
    TInstructionBundles extends InstructionBundleNode[]  = InstructionBundleNode[],
    TDefinedTypes extends DefinedTypeNode[] = DefinedTypeNode[],
    TErrors extends ErrorNode[] = ErrorNode[],
> {
    readonly kind: 'programNode';

    // Data.
    readonly name: CamelCaseString;
    readonly publicKey: string;
    readonly version: ProgramVersion;
    readonly origin?: 'anchor' | 'shank';
    readonly docs: Docs;

    // Children.
    readonly accounts: TAccounts;
    readonly instructions: TInstructions;
    readonly instructionBundles?: TInstructionBundles;
    readonly definedTypes: TDefinedTypes;
    readonly pdas: TPdas;
    readonly errors: TErrors;
}
