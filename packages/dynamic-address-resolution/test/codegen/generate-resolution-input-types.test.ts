import {
    instructionNode,
    instructionRemainingAccountsNode,
    integerTypeNode,
    integerValueNode,
    payerValueNode,
    programIdValueNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { generateResolutionInputTypes } from '../../src/codegen/generate-resolution-input-types';
import { account, makeRoot } from '../test-utils';

describe('generateResolutionInputTypes', () => {
    test('it generates the instruction data type', () => {
        const output = generateResolutionInputTypes(
            makeRoot([
                instructionNode({
                    data: structTypeNode([
                        structFieldTypeNode({
                            defaultValue: integerValueNode('2'),
                            defaultValueStrategy: 'omitted',
                            identifier: 'discriminator',
                            type: integerTypeNode('u8'),
                        }),
                        structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') }),
                        structFieldTypeNode({ identifier: 'memo', type: stringTypeNode('utf8') }),
                    ]),
                    identifier: 'transfer',
                }),
            ]),
        );
        expect(output).toContain(
            'export type TransferInstructionDataArgs = { amount: number | bigint; memo: string };',
        );
    });

    test('it skips the data type when there is no data to provide', () => {
        const output = generateResolutionInputTypes(makeRoot([instructionNode({ identifier: 'noop' })]));
        expect(output).not.toContain('NoopInstructionDataArgs');
    });

    test('it generates the accounts type, including remaining accounts', () => {
        const output = generateResolutionInputTypes(
            makeRoot([
                instructionNode({
                    accounts: [
                        account('payer', { defaultValue: payerValueNode() }),
                        account('systemProgram', { defaultValue: programIdValueNode() }),
                        account('closeAuthority', { isOptional: true }),
                        account('target'),
                    ],
                    identifier: 'create',
                    remainingAccounts: [
                        instructionRemainingAccountsNode('signers', { isSigner: true }),
                        instructionRemainingAccountsNode('extras', { isOptional: true }),
                    ],
                }),
            ]),
        );
        expect(output).toContain(
            [
                'export type CreateAccounts = {',
                '    payer: Address;',
                '    systemProgram?: Address;',
                '    closeAuthority: Address | null;',
                '    target: Address;',
                '    signers: Address[];',
                '    extras?: Address[];',
                '};',
            ].join('\n'),
        );
        expect(output).toContain(
            'export type CreateAccountsWithData = CreateAccounts & Record<string, Address | null | undefined>;',
        );
    });

    test('it emits loose accounts types for instructions without accounts', () => {
        const output = generateResolutionInputTypes(makeRoot([instructionNode({ identifier: 'noAccounts' })]));
        expect(output).toContain('export type NoAccountsAccounts = Record<string, never>;');
        expect(output).toContain(
            'export type NoAccountsAccountsWithData = Record<string, Address | null | undefined>;',
        );
    });
});
