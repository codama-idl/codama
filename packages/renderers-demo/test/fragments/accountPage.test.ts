import {
    accountNode,
    constantPdaSeedNodeFromString,
    definedTypeLinkNode,
    numberTypeNode,
    pdaNode,
    publicKeyTypeNode,
    structFieldTypeNode,
    structTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { pipe } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getAccountPageFragment } from '../../src/fragments';
import { addFragmentImports, fragment } from '../../src/utils';
import { getTypeVisitor } from '../../src/visitors';

test('it renders account pages', () => {
    const node = accountNode({
        data: structTypeNode([structFieldTypeNode({ name: 'maxSupply', type: numberTypeNode('u64') })]),
        docs: ['This is some description for the mint account.', 'It can use multiple lines.'],
        name: 'mint',
    });

    const result = getAccountPageFragment(node, getTypeVisitor());

    expect(result).toStrictEqual(fragment`---
title: Mint
description: Overview of the Mint account
---

# Mint

This is some description for the mint account.
It can use multiple lines.

## Account data

\`\`\`ts
type Mint = { maxSupply: number /* u64 */ }
\`\`\``);
});

test('it renders a fixed size paragraph.', () => {
    const node = accountNode({ name: 'token' });
    const result = getAccountPageFragment(node, getTypeVisitor(), 42);

    expect(result).toStrictEqual(fragment`---
title: Token
description: Overview of the Token account
---

# Token

## Account data

\`\`\`ts
type Token = {}
\`\`\`

This account has a fixed size of 42 bytes.`);
});

test('it renders PDA sections', () => {
    const node = accountNode({
        data: structTypeNode([structFieldTypeNode({ name: 'amount', type: numberTypeNode('u64') })]),
        name: 'token',
    });
    const pda = pdaNode({
        name: 'associatedToken',
        seeds: [
            variablePdaSeedNode('mint', publicKeyTypeNode()),
            variablePdaSeedNode('owner', publicKeyTypeNode()),
            constantPdaSeedNodeFromString('base58', 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        ],
    });
    const result = getAccountPageFragment(node, getTypeVisitor(), undefined, pda);

    expect(result).toStrictEqual(
        pipe(
            fragment`---
title: Token
description: Overview of the Token account
---

# Token

## Account data

\`\`\`ts
type Token = { amount: number /* u64 */ }
\`\`\`

## PDA

\`\`\`ts
const [address, bump] = await findAssociatedTokenPda({ mint, owner });
\`\`\`

## See also

- [AssociatedToken](../pdas/associatedToken.md)`,
            f => addFragmentImports(f, 'generatedPdas', 'AssociatedToken'),
        ),
    );
});

test('it renders see also sections', () => {
    const node = accountNode({
        data: structTypeNode([structFieldTypeNode({ name: 'maxSupply', type: definedTypeLinkNode('someType') })]),
        name: 'mint',
    });

    const result = getAccountPageFragment(node, getTypeVisitor());

    expect(result).toStrictEqual(
        pipe(
            fragment`---
title: Mint
description: Overview of the Mint account
---

# Mint

## Account data

\`\`\`ts
type Mint = { maxSupply: SomeType }
\`\`\`

## See also

- [SomeType](../types/someType.md)`,
            f => addFragmentImports(f, 'generatedTypes', 'SomeType'),
        ),
    );
});
