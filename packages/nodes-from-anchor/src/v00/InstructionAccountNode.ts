import { InstructionAccountNode, instructionAccountNode } from '@codama/nodes';

import { IdlV00Account, IdlV00AccountItem } from './idl';

export function instructionAccountNodesFromAnchorV00(idl: IdlV00AccountItem[]): InstructionAccountNode[] {
    return idl.flatMap(account =>
        'accounts' in account
            ? instructionAccountNodesFromAnchorV00(account.accounts)
            : [instructionAccountNodeFromAnchorV00(account)],
    );
}

export function instructionAccountNodeFromAnchorV00(idl: IdlV00Account): InstructionAccountNode {
    const isOptional = idl.optional ?? idl.isOptional ?? false;
    const desc = idl.desc ? [idl.desc] : undefined;
    return instructionAccountNode({
        docs: idl.docs ?? desc ?? [],
        isOptional,
        isSigner: idl.isOptionalSigner ? 'either' : (idl.isSigner ?? false),
        isWritable: idl.isMut ?? false,
        name: idl.name ?? '',
    });
}
