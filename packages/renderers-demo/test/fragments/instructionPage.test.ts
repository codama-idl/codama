import {
    definedTypeLinkNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getInstructionPageFragment } from '../../src/fragments';
import { addFragmentImports, fragment } from '../../src/utils';
import { getTypeVisitor } from '../../src/visitors';

test('it renders instruction pages', () => {
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                docs: ['Pays for the storage fees.'],
                isSigner: true,
                isWritable: true,
                name: 'payer',
            }),
            instructionAccountNode({
                docs: ['The account being created.'],
                isSigner: false,
                isWritable: true,
                name: 'newAccount',
            }),
            instructionAccountNode({
                docs: ['A dummy account.'],
                isOptional: true,
                isSigner: 'either',
                isWritable: true,
                name: 'optionalAccount',
            }),
        ],
        arguments: [instructionArgumentNode({ name: 'lamports', type: numberTypeNode('u64') })],
        docs: ['This is some description for the Create Account instruction.', 'It can use multiple lines.'],
        name: 'createAccount',
    });

    const expectedContent = `---
title: Create Account
description: Overview of the Create Account instruction
---

# Create Account

This is some description for the Create Account instruction.
It can use multiple lines.

## Instruction accounts

| Name              | Signer | Writable | Required | Description                |
| ----------------- | ------ | -------- | -------- | -------------------------- |
| \`payer\`           | ✅      | ✅        | ✅        | Pays for the storage fees. |
| \`newAccount\`      | ❌      | ✅        | ✅        | The account being created. |
| \`optionalAccount\` | either | ✅        | ❌        | A dummy account.           |

## Instruction arguments

\`\`\`ts
type CreateAccountInstruction = { lamports: number /* u64 */ }
\`\`\``;

    expect(getInstructionPageFragment(node, getTypeVisitor())).toStrictEqual(fragment(expectedContent));
});

test('it renders a page with no accounts nor arguments', () => {
    const node = instructionNode({ name: 'createAccount' });

    const expectedContent = `---
title: Create Account
description: Overview of the Create Account instruction
---

# Create Account

## Instruction accounts

_This instruction has no accounts._

## Instruction arguments

_This instruction has no arguments._`;

    expect(getInstructionPageFragment(node, getTypeVisitor())).toStrictEqual(fragment(expectedContent));
});

test('it renders see also sections', () => {
    const node = instructionNode({
        arguments: [instructionArgumentNode({ name: 'lamports', type: definedTypeLinkNode('someType') })],
        name: 'createAccount',
    });

    const expectedContent = `---
title: Create Account
description: Overview of the Create Account instruction
---

# Create Account

## Instruction accounts

_This instruction has no accounts._

## Instruction arguments

\`\`\`ts
type CreateAccountInstruction = { lamports: SomeType }
\`\`\`

## See also

- [SomeType](../types/someType.md)`;

    expect(getInstructionPageFragment(node, getTypeVisitor())).toStrictEqual(
        addFragmentImports(fragment(expectedContent), 'generatedTypes', 'SomeType'),
    );
});
