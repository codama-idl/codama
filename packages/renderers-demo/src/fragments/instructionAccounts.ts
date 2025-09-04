import { camelCase, InstructionAccountNode } from '@codama/nodes';

import { Fragment, getTableFragment } from '../utils';

export function getInstructionAccountsFragment(accounts: InstructionAccountNode[]): Fragment | undefined {
    if (accounts.length === 0) return;

    const hasDescriptions = (accounts ?? []).some(account => account.docs && account.docs.length > 0);
    const accountHeaders = ['Name', 'Signer', 'Writable', 'Required', ...(hasDescriptions ? ['Description'] : [])];
    const accountRows = accounts.map(account => [
        `\`${camelCase(account.name)}\``,
        formatBoolean(account.isSigner ?? false),
        formatBoolean(account.isWritable ?? false),
        formatBoolean(!(account.isOptional ?? false)),
        ...(hasDescriptions ? [(account.docs ?? []).join(' ')] : []),
    ]);

    return getTableFragment(accountHeaders, accountRows);
}

function formatBoolean(value: boolean | 'either') {
    return value === 'either' ? value : value ? '✅' : '❌';
}
