import type { AccountNode } from '../AccountNode';
import { InstructionAccountLinkNode } from '../linkNodes';
import type { CamelCaseString, ImportFrom } from '../shared';

export interface InstructionAccountOverrideNode<
    TAccounts extends InstructionAccountLinkNode[] = InstructionAccountLinkNode[],
    TDefaultAccount extends AccountNode | undefined = AccountNode | undefined
> {
    readonly kind: 'instructionAccountOverrideNode';

    // Data.
    readonly name: CamelCaseString;
    readonly replace?: TAccounts;
    readonly defaultAccount?: TDefaultAccount;
    readonly importFrom?: ImportFrom;
}
