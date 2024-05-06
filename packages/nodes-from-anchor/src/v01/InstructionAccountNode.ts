import { InstructionAccountNode, instructionAccountNode, publicKeyValueNode } from '@kinobi-so/nodes';

import { IdlV01InstructionAccount, IdlV01InstructionAccountItem } from './idl';

export function instructionAccountNodesFromAnchorV01(idl: IdlV01InstructionAccountItem[]): InstructionAccountNode[] {
    return idl.flatMap(account =>
        'accounts' in account
            ? instructionAccountNodesFromAnchorV01(account.accounts)
            : [instructionAccountNodeFromAnchorV01(account)],
    );
}

export function instructionAccountNodeFromAnchorV01(idl: IdlV01InstructionAccount): InstructionAccountNode {
    const isOptional = idl.optional ?? false;
    const docs = idl.docs ?? [];
    const isSigner = idl.signer ?? false;
    const isWritable = idl.writable ?? false;
    const name = idl.name ?? '';
    let defaultValue = undefined;

    if (idl.address) {
        defaultValue = publicKeyValueNode(idl.address, name);
    }

    return instructionAccountNode({
        defaultValue,
        docs,
        isOptional,
        isSigner,
        isWritable,
        name,
    });
}
