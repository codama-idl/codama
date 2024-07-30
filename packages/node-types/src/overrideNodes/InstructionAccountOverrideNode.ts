import type { AccountNode } from '../AccountNode';
import { InstructionAccountLinkNode, InstructionLinkNode } from '../linkNodes';
import type { CamelCaseString, ImportFrom } from '../shared';

export interface InstructionAccountOverrideNode<
    TInstruction extends InstructionLinkNode = InstructionLinkNode,
    TAccounts extends InstructionAccountLinkNode[] = InstructionAccountLinkNode[],
    TDefaultAccount extends AccountNode | undefined = AccountNode | undefined
> {
    readonly kind: 'instructionAccountOverrideNode';

    // Data.
    readonly name: CamelCaseString;
    readonly instruction: TInstruction;
    readonly replace?: TAccounts;
    readonly defaultAccount?: TDefaultAccount;
    readonly importFrom?: ImportFrom;
}
