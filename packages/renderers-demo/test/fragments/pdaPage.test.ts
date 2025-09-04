import {
    constantPdaSeedNode,
    constantPdaSeedNodeFromString,
    definedTypeLinkNode,
    enumValueNode,
    pdaNode,
    publicKeyTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getPdaPageFragment } from '../../src/fragments';
import { addFragmentImports, fragment } from '../../src/utils';
import { getTypeVisitor, getValueVisitor } from '../../src/visitors';

test('it renders PDA pages', () => {
    const node = pdaNode({
        docs: ['This is some description for the Associated Token PDA.', 'It can use multiple lines.'],
        name: 'associatedToken',
        seeds: [
            variablePdaSeedNode('mint', publicKeyTypeNode(), 'The Mint account.'),
            variablePdaSeedNode('owner', publicKeyTypeNode(), 'The Owner account.'),
            constantPdaSeedNodeFromString('base58', 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        ],
    });

    const expectedContent = `---
title: Associated Token PDA
description: Overview of the Associated Token PDA
---

# Associated Token PDA

This is some description for the Associated Token PDA.
It can use multiple lines.

## Seeds

| Seed       | Type      | Value                                           |
| ---------- | --------- | ----------------------------------------------- |
| \`mint\`     | \`Address\` | The Mint account.                               |
| \`owner\`    | \`Address\` | The Owner account.                              |
| _constant_ | \`string\`  | \`"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"\` |`;

    expect(getPdaPageFragment(node, getTypeVisitor(), getValueVisitor())).toStrictEqual(fragment(expectedContent));
});

test('it renders a page with no seeds', () => {
    const node = pdaNode({ name: 'counter', seeds: [] });

    const expectedContent = `---
title: Counter PDA
description: Overview of the Counter PDA
---

# Counter PDA

## Seeds

_This PDA has no seeds._`;

    expect(getPdaPageFragment(node, getTypeVisitor(), getValueVisitor())).toStrictEqual(fragment(expectedContent));
});

test('it renders see also sections', () => {
    const node = pdaNode({
        name: 'counter',
        seeds: [
            variablePdaSeedNode('authority', publicKeyTypeNode(), 'The Authority account.'),
            constantPdaSeedNode(definedTypeLinkNode('counterMode'), enumValueNode('counterMode', 'incremental')),
        ],
    });

    const expectedContent = `---
title: Counter PDA
description: Overview of the Counter PDA
---

# Counter PDA

## Seeds

| Seed        | Type          | Value                     |
| ----------- | ------------- | ------------------------- |
| \`authority\` | \`Address\`     | The Authority account.    |
| _constant_  | \`CounterMode\` | \`CounterMode.Incremental\` |

## See also

- [CounterMode](../types/counterMode.md)`;

    expect(getPdaPageFragment(node, getTypeVisitor(), getValueVisitor())).toStrictEqual(
        addFragmentImports(fragment(expectedContent), 'generatedTypes', 'CounterMode'),
    );
});
