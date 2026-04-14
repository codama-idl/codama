import { address, getAddressEncoder } from '@solana/addresses';
import { accountValueNode, instructionAccountNode, instructionNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../../../svm-test-context';
import { makeVisitor } from './pda-seed-value-test-utils';

describe('pda-seed-value: visitAccountValue', () => {
    const ixNodeWithAccount = instructionNode({
        accounts: [
            instructionAccountNode({
                isSigner: false,
                isWritable: false,
                name: 'authority',
            }),
        ],
        name: 'testInstruction',
    });

    test('should encode provided account address', async () => {
        const randomAddress = await new SvmTestContext().createAccount();
        const visitor = makeVisitor({
            accountsInput: { authority: randomAddress },
            ixNode: ixNodeWithAccount,
        });
        const result = await visitor.visitAccountValue(accountValueNode('authority'));
        expect(result).toEqual(getAddressEncoder().encode(address(randomAddress)));
    });

    test('should fall through to resolution when provided address is null', async () => {
        const visitor = makeVisitor({
            accountsInput: { authority: null },
            ixNode: ixNodeWithAccount,
        });
        // null is not treated as a provided address — it falls through to resolveAccountAddress,
        // which throws because the account has no default value
        await expect(visitor.visitAccountValue(accountValueNode('authority'))).rejects.toThrow(
            /Missing account \[authority\]/,
        );
    });

    test('should throw when resolved address is null', async () => {
        const ixNodeWithOptionalAccount = instructionNode({
            accounts: [
                instructionAccountNode({
                    isOptional: true,
                    isSigner: false,
                    isWritable: false,
                    name: 'authority',
                }),
            ],
            name: 'testInstruction',
            optionalAccountStrategy: 'omitted',
        });
        const visitor = makeVisitor({
            accountsInput: { authority: null },
            ixNode: ixNodeWithOptionalAccount,
        });
        await expect(visitor.visitAccountValue(accountValueNode('authority'))).rejects.toThrow(
            /Failed to derive PDA for account \[authority\]/,
        );
    });

    test('should throw for unknown account reference', async () => {
        const visitor = makeVisitor({ ixNode: ixNodeWithAccount });
        await expect(visitor.visitAccountValue(accountValueNode('nonexistent'))).rejects.toThrow(
            /Referenced node \[nonexistent\] not found in \[testInstruction\]/,
        );
    });

    test('should throw on circular dependency', async () => {
        const visitor = makeVisitor({
            ixNode: ixNodeWithAccount,
            resolutionPath: ['authority'],
        });
        await expect(visitor.visitAccountValue(accountValueNode('authority'))).rejects.toThrow(
            /Circular dependency detected: \[/,
        );
    });
});
