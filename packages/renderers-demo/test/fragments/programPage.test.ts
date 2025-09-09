import {
    accountNode,
    definedTypeNode,
    enumTypeNode,
    errorNode,
    instructionNode,
    pdaNode,
    programNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getProgramPageFragment } from '../../src/fragments';
import { fragment } from '../../src/utils';

test('it renders program pages', () => {
    const node = programNode({
        accounts: [accountNode({ name: 'mint' }), accountNode({ name: 'token' })],
        definedTypes: [
            definedTypeNode({ name: 'accountState', type: enumTypeNode([]) }),
            definedTypeNode({ name: 'authorityType', type: enumTypeNode([]) }),
        ],
        docs: ['This is some description for the token program.', 'It can use multiple lines.'],
        errors: [
            errorNode({ code: 0, message: 'Lamport balance below rent-exempt threshold', name: 'notRentExempt' }),
            errorNode({ code: 1, message: 'Insufficient funds', name: 'insufficientFunds' }),
            errorNode({ code: 2, message: 'Invalid Mint account', name: 'invalidMint' }),
            errorNode({ code: 3, message: 'Account not associated with this Mint', name: 'mintMismatch' }),
            errorNode({ code: 4, message: 'Owner does not match', name: 'ownerMismatch' }),
        ],
        instructions: [
            instructionNode({ name: 'initializeMint' }),
            instructionNode({ name: 'initializeAccount' }),
            instructionNode({ name: 'mintTo' }),
            instructionNode({ name: 'transfer' }),
            instructionNode({ name: 'revoke' }),
            instructionNode({ name: 'burn' }),
        ],
        name: 'token',
        pdas: [pdaNode({ name: 'associatedToken', seeds: [] })],
        publicKey: 'TokenKegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        version: '1.2.3',
    });

    const result = getProgramPageFragment(node);

    expect(result).toStrictEqual(fragment`---
title: Token Program
description: Overview of the Token Program
---

# Token Program

This is some description for the token program.
It can use multiple lines.

## Information

- Address: \`TokenKegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\`
- Version: \`1.2.3\`

## Accounts

- [Mint](accounts/mint.md)
- [Token](accounts/token.md)

## Instructions

- [Initialize Mint](instructions/initializeMint.md)
- [Initialize Account](instructions/initializeAccount.md)
- [Mint To](instructions/mintTo.md)
- [Transfer](instructions/transfer.md)
- [Revoke](instructions/revoke.md)
- [Burn](instructions/burn.md)

## PDAs

- [Associated Token](pdas/associatedToken.md)

## Defined types

- [Account State](definedTypes/accountState.md)
- [Authority Type](definedTypes/authorityType.md)

## Errors

| Name               | Code | Message                                     |
| ------------------ | ---- | ------------------------------------------- |
| Not Rent Exempt    | \`0\`  | Lamport balance below rent-exempt threshold |
| Insufficient Funds | \`1\`  | Insufficient funds                          |
| Invalid Mint       | \`2\`  | Invalid Mint account                        |
| Mint Mismatch      | \`3\`  | Account not associated with this Mint       |
| Owner Mismatch     | \`4\`  | Owner does not match                        |`);
});

test('it renders pages for empty program', () => {
    const node = programNode({ name: 'token', publicKey: 'TokenKegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' });

    const result = getProgramPageFragment(node);

    expect(result).toStrictEqual(fragment`---
title: Token Program
description: Overview of the Token Program
---

# Token Program

## Information

- Address: \`TokenKegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\`
- Version: \`0.0.0\`

## Accounts

_This program has no accounts._

## Instructions

_This program has no instructions._

## PDAs

_This program has no PDAs._

## Defined types

_This program has no defined types._

## Errors

_This program has no errors._`);
});
