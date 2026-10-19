import {
    booleanTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    instructionNode,
    instructionRemainingAccountsNode,
    integerTypeNode,
    integerValueNode,
    optionTypeNode,
    payerValueNode,
    programIdValueNode,
    programLinkNode,
    programNode,
    rootNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    type TypeNode,
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

    test('it references recursive data types by their alias', () => {
        // Given data holding a linked list node, whose next node links back to it.
        const node = definedTypeNode({
            identifier: 'node',
            type: structTypeNode([
                structFieldTypeNode({ identifier: 'next', type: optionTypeNode(definedTypeLinkNode('node')) }),
            ]),
        });
        const push = instructionNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'head', type: definedTypeLinkNode('node') })]),
            identifier: 'push',
        });
        const root = rootNode(
            programNode({ definedTypes: [node], identifier: 'p', instructions: [push], publicKey: '1111' }),
        );

        // Then the link back to the node is referenced by its alias.
        expect(generateResolutionInputTypes(root)).toContain(
            'export type PushInstructionDataArgs = { head: { next?: NodeArgs | null } };',
        );
    });

    test('it resolves linked data types from other programs', () => {
        // Given data linking to the arguments of another program, also defined differently by its own program.
        const args = (type: TypeNode) =>
            definedTypeNode({
                identifier: 'args',
                type: structTypeNode([structFieldTypeNode({ identifier: 'value', type })]),
            });
        const set = instructionNode({
            data: definedTypeLinkNode('args', { program: programLinkNode('other') }),
            identifier: 'set',
        });
        const root = rootNode(
            programNode({
                definedTypes: [args(booleanTypeNode())],
                identifier: 'p',
                instructions: [set],
                publicKey: '1111',
            }),
            {
                additionalPrograms: [
                    programNode({
                        definedTypes: [args(integerTypeNode('u64'))],
                        identifier: 'other',
                        publicKey: '2222',
                    }),
                ],
            },
        );
        expect(generateResolutionInputTypes(root)).toContain(
            'export type SetInstructionDataArgs = { value: number | bigint };',
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
