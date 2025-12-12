import { camelCase, InstructionAccountNode, instructionAccountNode } from '@codama/nodes';

import { IdlV00Account, IdlV00AccountItem } from './idl';

function hasDuplicateAccountNames(idl: IdlV00AccountItem[]): boolean {
    const seenNames = new Set<string>();

    function checkDuplicates(items: IdlV00AccountItem[]): boolean {
        for (const item of items) {
            if ('accounts' in item) {
                if (checkDuplicates(item.accounts)) {
                    return true;
                }
            } else {
                const name = camelCase(item.name ?? '');
                if (seenNames.has(name)) {
                    return true;
                }
                seenNames.add(name);
            }
        }
        return false;
    }

    return checkDuplicates(idl);
}

export function instructionAccountNodesFromAnchorV00(
    idl: IdlV00AccountItem[],
    prefix?: string,
): InstructionAccountNode[] {
    const shouldPrefix = prefix !== undefined || hasDuplicateAccountNames(idl);

    return idl.flatMap(account =>
        'accounts' in account
            ? instructionAccountNodesFromAnchorV00(
                  account.accounts,
                  shouldPrefix ? (prefix ? `${prefix}_${account.name}` : account.name) : undefined,
              )
            : [instructionAccountNodeFromAnchorV00(account, shouldPrefix ? prefix : undefined)],
    );
}

export function instructionAccountNodeFromAnchorV00(idl: IdlV00Account, prefix?: string): InstructionAccountNode {
    const isOptional = idl.optional ?? idl.isOptional ?? false;
    const desc = idl.desc ? [idl.desc] : undefined;
    return instructionAccountNode({
        docs: idl.docs ?? desc ?? [],
        isOptional,
        isSigner: idl.isOptionalSigner ? 'either' : (idl.isSigner ?? false),
        isWritable: idl.isMut ?? false,
        name: prefix ? `${prefix}_${idl.name ?? ''}` : (idl.name ?? ''),
    });
}
