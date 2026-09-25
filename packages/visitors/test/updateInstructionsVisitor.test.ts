import {
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CODAMA_ERROR__VISITORS__INSTRUCTION_ACCOUNT_NOT_FOUND,
    CODAMA_ERROR__VISITORS__INSTRUCTION_DATA_FIELD_NOT_FOUND,
    CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS,
    CodamaError,
    isCodamaError,
} from '@codama/errors';
import {
    accountBumpValueNode,
    accountValueNode,
    assertIsNode,
    constantDiscriminatorNode,
    constantValueNode,
    dataValueNode,
    definedTypeLinkNode,
    fieldDiscriminatorNode,
    identifierString,
    injectedValueNode,
    instructionAccountLinkNode,
    instructionAccountNode,
    instructionByteDeltaNode,
    instructionDisplayNode,
    instructionLinkNode,
    instructionNode,
    instructionRemainingAccountsNode,
    integerTypeNode,
    integerValueNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    programNode,
    providedNode,
    publicKeyTypeNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { updateInstructionsVisitor } from '../src';

const u8Field = (identifier: string) => structFieldTypeNode({ identifier, type: integerTypeNode('u8') });
const account = (identifier: string, defaultValue?: Parameters<typeof instructionAccountNode>[0]['defaultValue']) =>
    instructionAccountNode({ defaultValue, identifier, isSigner: false, isWritable: false });

test('it updates the identifier of an instruction', () => {
    // Given the following program node with one instruction.
    const node = programNode({
        identifier: 'myProgram',
        instructions: [instructionNode({ identifier: 'myInstruction' })],
        publicKey: '1111',
    });

    // When we update the identifier of that instruction.
    const result = visit(node, updateInstructionsVisitor({ myInstruction: { identifier: 'myNewInstruction' } }));

    // Then we expect the instruction to be renamed.
    assertIsNode(result, 'programNode');
    expect(result.instructions?.[0].identifier).toBe('myNewInstruction');
});

test('it updates the identifier of an instruction within a specific program', () => {
    // Given two programs each with an instruction of the same identifier.
    const node = rootNode(
        programNode({
            identifier: 'myProgramA',
            instructions: [instructionNode({ identifier: 'transfer' })],
            publicKey: '1111',
        }),
        {
            additionalPrograms: [
                programNode({
                    identifier: 'myProgramB',
                    instructions: [instructionNode({ identifier: 'transfer' })],
                    publicKey: '2222',
                }),
            ],
        },
    );

    // When we update the identifier of that instruction in the first program.
    const result = visit(node, updateInstructionsVisitor({ 'myProgramA.transfer': { identifier: 'newTransfer' } }));

    // Then we expect the first instruction to have been renamed but not the second one.
    assertIsNode(result, 'rootNode');
    expect(result.program.instructions?.[0].identifier).toBe('newTransfer');
    expect(result.additionalPrograms?.[0].instructions?.[0].identifier).toBe('transfer');
});

test('it updates instruction accounts', () => {
    // Given an instruction with one account.
    const node = instructionNode({ accounts: [account('myAccount')], identifier: 'myInstruction' });

    // When we rename that account and make it writable.
    const result = visit(
        node,
        updateInstructionsVisitor({
            myInstruction: { accounts: { myAccount: { identifier: 'myNewAccount', isWritable: true } } },
        }),
    );

    // Then we expect the account to be updated.
    expect(result).toStrictEqual(
        instructionNode({
            accounts: [instructionAccountNode({ identifier: 'myNewAccount', isSigner: false, isWritable: true })],
            identifier: 'myInstruction',
        }),
    );
});

test('it sets and removes account default values, filling PDA seeds', () => {
    // Given an instruction with an account having a default value and a PDA whose seeds match the instruction.
    const pda = pdaNode({ identifier: 'vault', seeds: [variablePdaSeedNode('owner', publicKeyTypeNode())] });
    const instruction = instructionNode({
        accounts: [account('owner', accountValueNode('payer')), account('vault'), account('payer')],
        identifier: 'deposit',
    });
    const node = programNode({ identifier: 'myProgram', instructions: [instruction], pdas: [pda], publicKey: '1111' });

    // When we remove the first default value and set a PDA default value on the vault.
    const result = visit(
        node,
        updateInstructionsVisitor({
            deposit: { accounts: { owner: { defaultValue: null }, vault: { defaultValue: pdaValueNode('vault') } } },
        }),
    );

    // Then the first default is removed and the PDA seeds are filled.
    assertIsNode(result, 'programNode');
    const [owner, vault] = result.instructions?.[0].accounts ?? [];
    expect(owner.defaultValue).toBeUndefined();
    expect(vault.defaultValue).toStrictEqual(
        pdaValueNode('vault', { seeds: [pdaSeedValueNode('owner', accountValueNode('owner'))] }),
    );
});

test('it updates instruction data fields by path', () => {
    // Given an instruction whose data has a nested field.
    const node = instructionNode({
        data: structTypeNode([
            u8Field('discriminator'),
            structFieldTypeNode({ identifier: 'config', type: structTypeNode([u8Field('fee')]) }),
        ]),
        identifier: 'myInstruction',
    });

    // When we update a top-level field and a nested field.
    const result = visit(
        node,
        updateInstructionsVisitor({
            myInstruction: {
                data: {
                    'config.fee': { identifier: 'feeBps', type: integerTypeNode('u16') },
                    discriminator: { defaultValue: integerValueNode('42'), defaultValueStrategy: 'omitted' },
                },
            },
        }),
    );

    // Then we expect both fields to be updated.
    expect(result).toStrictEqual(
        instructionNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: integerValueNode('42'),
                    defaultValueStrategy: 'omitted',
                    identifier: 'discriminator',
                    type: integerTypeNode('u8'),
                }),
                structFieldTypeNode({
                    identifier: 'config',
                    type: structTypeNode([structFieldTypeNode({ identifier: 'feeBps', type: integerTypeNode('u16') })]),
                }),
            ]),
            identifier: 'myInstruction',
        }),
    );
});

test('it sets contextual data defaults through injected values and provides', () => {
    // Given an instruction with a bump data field and an existing provided node.
    const node = instructionNode({
        accounts: [account('pda')],
        data: structTypeNode([u8Field('bump')]),
        identifier: 'create',
        provides: [providedNode('old', integerValueNode('1')), providedNode('kept', integerValueNode('2'))],
    });

    // When we set its default value to an injection and provide the bump.
    const result = visit(
        node,
        updateInstructionsVisitor({
            create: {
                data: { bump: { defaultValue: injectedValueNode({ key: 'bump' }) } },
                provides: { bump: accountBumpValueNode('pda'), old: null },
            },
        }),
    );

    // Then the default value is injected and the provided nodes are merged by identifier.
    assertIsNode(result, 'instructionNode');
    expect(result.data).toStrictEqual(
        structTypeNode([
            structFieldTypeNode({
                defaultValue: injectedValueNode({ key: 'bump' }),
                identifier: 'bump',
                type: integerTypeNode('u8'),
            }),
        ]),
    );
    expect(result.provides).toStrictEqual([
        providedNode('kept', integerValueNode('2')),
        providedNode('bump', accountBumpValueNode('pda')),
    ]);
});

test('it removes data field default values', () => {
    // Given an instruction whose data field has a default value.
    const node = instructionNode({
        data: structTypeNode([
            structFieldTypeNode({
                defaultValue: integerValueNode('1'),
                defaultValueStrategy: 'optional',
                identifier: 'amount',
                type: integerTypeNode('u64'),
            }),
        ]),
        identifier: 'myInstruction',
    });

    // When we remove it.
    const result = visit(
        node,
        updateInstructionsVisitor({ myInstruction: { data: { amount: { defaultValue: null } } } }),
    );

    // Then the field has no default value nor strategy.
    expect(result).toStrictEqual(
        instructionNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })]),
            identifier: 'myInstruction',
        }),
    );
});

test('it repoints references to renamed accounts and data fields', () => {
    // Given an instruction whose accounts and data are referenced throughout.
    const node = programNode({
        identifier: 'myProgram',
        instructions: [
            instructionNode({
                accounts: [account('source'), account('destination', accountValueNode('source'))],
                byteDeltas: [instructionByteDeltaNode(dataValueNode('args.amount'))],
                data: structTypeNode([
                    u8Field('discriminator'),
                    structFieldTypeNode({ identifier: 'args', type: structTypeNode([u8Field('amount')]) }),
                    structFieldTypeNode({
                        defaultValue: injectedValueNode({ key: 'bump' }),
                        identifier: 'bump',
                        type: integerTypeNode('u8'),
                    }),
                ]),
                discriminators: [fieldDiscriminatorNode('discriminator')],
                display: instructionDisplayNode({
                    interpolatedIntent: 'Send ${data.args.amount} from ${accounts.source}',
                }),
                identifier: 'transfer',
                provides: [providedNode('bump', accountBumpValueNode('source'))],
            }),
            instructionNode({
                accounts: [account('other', accountValueNode('source'))],
                identifier: 'other',
            }),
        ],
        publicKey: '1111',
    });

    // When we rename an account and data fields.
    const result = visit(
        node,
        updateInstructionsVisitor({
            transfer: {
                accounts: { source: { identifier: 'from' } },
                data: { args: { identifier: 'params' }, discriminator: { identifier: 'kind' } },
            },
        }),
    );

    // Then every reference within the instruction is repointed.
    assertIsNode(result, 'programNode');
    const [transfer, other] = result.instructions ?? [];
    expect(transfer.accounts?.[1].defaultValue).toStrictEqual(accountValueNode('from'));
    expect(transfer.discriminators).toStrictEqual([fieldDiscriminatorNode('kind')]);
    expect(transfer.display).toStrictEqual(
        instructionDisplayNode({ interpolatedIntent: 'Send ${data.params.amount} from ${accounts.from}' }),
    );
    expect(transfer.provides).toStrictEqual([providedNode('bump', accountBumpValueNode('from'))]);
    expect(transfer.byteDeltas).toStrictEqual([instructionByteDeltaNode(dataValueNode('params.amount'))]);

    // But references in other instructions are left alone.
    expect(other.accounts?.[0].defaultValue).toStrictEqual(accountValueNode('source'));
});

test('it repoints instruction and instruction account links', () => {
    // Given an instruction providing a link to an account of another instruction.
    const link = instructionAccountLinkNode('vault', { instruction: instructionLinkNode('initialize') });
    const node = programNode({
        identifier: 'myProgram',
        instructions: [
            instructionNode({ accounts: [account('vault')], identifier: 'initialize' }),
            instructionNode({
                accounts: [account('vault')],
                identifier: 'close',
                provides: [providedNode('initVault', link)],
            }),
        ],
        publicKey: '1111',
    });

    // When we rename the first instruction and its account.
    const result = visit(
        node,
        updateInstructionsVisitor({
            initialize: { accounts: { vault: { identifier: 'newVault' } }, identifier: 'init' },
        }),
    );

    // Then the link now points to the renamed instruction and account.
    assertIsNode(result, 'programNode');
    expect(result.instructions?.[1].provides).toStrictEqual([
        providedNode('initVault', instructionAccountLinkNode('newVault', { instruction: instructionLinkNode('init') })),
    ]);

    // But the other instruction's own account is left alone.
    expect(result.instructions?.[1].accounts?.[0].identifier).toBe('vault');
});

test('it updates the byte deltas, discriminators and remaining accounts of an instruction', () => {
    // Given an instruction with no byte deltas, discriminators nor remaining accounts.
    const node = instructionNode({ identifier: 'myInstruction' });

    // When we update them.
    const byteDeltas = [instructionByteDeltaNode(integerValueNode('100'))];
    const discriminators = [
        constantDiscriminatorNode(constantValueNode(integerTypeNode('u64'), integerValueNode('42'))),
    ];
    const remainingAccounts = [instructionRemainingAccountsNode('extraAccounts')];
    const result = visit(
        node,
        updateInstructionsVisitor({ myInstruction: { byteDeltas, discriminators, remainingAccounts } }),
    );

    // Then we expect them to be set.
    expect(result).toStrictEqual(
        instructionNode({ byteDeltas, discriminators, identifier: 'myInstruction', remainingAccounts }),
    );
});

test('it deletes instructions', () => {
    // Given a program with two instructions.
    const node = programNode({
        identifier: 'myProgram',
        instructions: [instructionNode({ identifier: 'a' }), instructionNode({ identifier: 'b' })],
        publicKey: '1111',
    });

    // When we delete one of them, then only the other one remains.
    const result = visit(node, updateInstructionsVisitor({ a: { delete: true } }));
    assertIsNode(result, 'programNode');
    expect(result.instructions?.map(instruction => instruction.identifier)).toStrictEqual(['b']);
});

test('it throws when updating missing accounts or data fields', () => {
    // Given an instruction whose data links to a defined type.
    const node = instructionNode({ accounts: [account('a')], data: definedTypeLinkNode('args'), identifier: 'ix' });

    // When we update a missing account, then we expect an error.
    expect(() => visit(node, updateInstructionsVisitor({ ix: { accounts: { b: { isWritable: true } } } }))).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__INSTRUCTION_ACCOUNT_NOT_FOUND, {
            accountName: 'b',
            instruction: node,
            instructionName: identifierString('ix'),
        }),
    );

    // When we update a field behind the link, then we expect an error.
    expect(() => visit(node, updateInstructionsVisitor({ ix: { data: { amount: { docs: 'Amount.' } } } }))).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__INSTRUCTION_DATA_FIELD_NOT_FOUND, {
            instruction: node,
            instructionName: identifierString('ix'),
            path: 'amount',
        }),
    );
});

test('it throws on unrecognized keys and contextual data defaults', () => {
    // When we use the v1 `arguments` key, then we expect an error when creating the visitor.
    let error: unknown;
    try {
        updateInstructionsVisitor({ ix: { arguments: {} } as never });
    } catch (e) {
        error = e;
    }
    expect(isCodamaError(error, CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS)).toBe(true);

    // When we set a contextual default value on a data field, then we expect an error too.
    error = undefined;
    try {
        updateInstructionsVisitor({ ix: { data: { bump: { defaultValue: accountBumpValueNode('pda') as never } } } });
    } catch (e) {
        error = e;
    }
    expect(isCodamaError(error, CODAMA_ERROR__UNEXPECTED_NODE_KIND)).toBe(true);
});

test('it renames a data field and one of its nested fields in the same update', () => {
    // Given an instruction whose nested amount is referenced by a data value.
    const node = instructionNode({
        accounts: [account('meta', dataValueNode('args.amount'))],
        data: structTypeNode([structFieldTypeNode({ identifier: 'args', type: structTypeNode([u8Field('amount')]) })]),
        identifier: 'ix',
    });

    // When we rename both the parent and the nested field, parent first.
    const result = visit(
        node,
        updateInstructionsVisitor({
            ix: { data: { args: { identifier: 'params' }, 'args.amount': { identifier: 'lamports' } } },
        }),
    );

    // Then both renames are applied and the reference matches the new field.
    expect(result).toStrictEqual(
        instructionNode({
            accounts: [account('meta', dataValueNode('params.lamports'))],
            data: structTypeNode([
                structFieldTypeNode({ identifier: 'params', type: structTypeNode([u8Field('lamports')]) }),
            ]),
            identifier: 'ix',
        }),
    );
});

test('it fills new PDA default values against the updated instruction', () => {
    // Given a PDA seeded by an `owner` public key and an instruction with an `owner` account.
    const pda = pdaNode({ identifier: 'vault', seeds: [variablePdaSeedNode('owner', publicKeyTypeNode())] });
    const node = programNode({
        identifier: 'myProgram',
        instructions: [instructionNode({ accounts: [account('owner'), account('vault')], identifier: 'deposit' })],
        pdas: [pda],
        publicKey: '1111',
    });

    // When we rename the `owner` account and set a PDA default value in the same update.
    const result = visit(
        node,
        updateInstructionsVisitor({
            deposit: {
                accounts: { owner: { identifier: 'authority' }, vault: { defaultValue: pdaValueNode('vault') } },
            },
        }),
    );

    // Then the seed is not filled with the account that no longer exists.
    assertIsNode(result, 'programNode');
    const [authority, vault] = result.instructions?.[0].accounts ?? [];
    expect(authority.identifier).toBe('authority');
    expect(vault.defaultValue).toStrictEqual(pdaValueNode('vault'));
});

test('it fills new PDA default values using renamed accounts', () => {
    // Given a PDA seeded by an `authority` public key and an instruction with an `owner` account.
    const pda = pdaNode({ identifier: 'vault', seeds: [variablePdaSeedNode('authority', publicKeyTypeNode())] });
    const node = programNode({
        identifier: 'myProgram',
        instructions: [instructionNode({ accounts: [account('owner'), account('vault')], identifier: 'deposit' })],
        pdas: [pda],
        publicKey: '1111',
    });

    // When we rename `owner` to `authority` and set a PDA default value in the same update.
    const result = visit(
        node,
        updateInstructionsVisitor({
            deposit: {
                accounts: { owner: { identifier: 'authority' }, vault: { defaultValue: pdaValueNode('vault') } },
            },
        }),
    );

    // Then the seed is filled with the renamed account.
    assertIsNode(result, 'programNode');
    expect(result.instructions?.[0].accounts?.[1].defaultValue).toStrictEqual(
        pdaValueNode('vault', { seeds: [pdaSeedValueNode('authority', accountValueNode('authority'))] }),
    );
});

test('it merges updates from several entries matching the same instruction', () => {
    // Given an instruction with an account and a data field.
    const node = programNode({
        identifier: 'myProgram',
        instructions: [
            instructionNode({
                accounts: [account('source', undefined), account('meta', accountValueNode('source'))],
                data: structTypeNode([u8Field('amount')]),
                identifier: 'transfer',
            }),
        ],
        publicKey: '1111',
    });

    // When a first entry renames an account and a field, and a second one updates them by their original identifiers.
    const result = visit(
        node,
        updateInstructionsVisitor({
            'myProgram.transfer': {
                accounts: { source: { identifier: 'from' } },
                data: { amount: { identifier: 'lamports' } },
                identifier: 'send',
            },
            transfer: {
                accounts: { source: { isWritable: true } },
                data: { amount: { type: integerTypeNode('u64') } },
            },
        }),
    );

    // Then every update is applied and references are repointed.
    assertIsNode(result, 'programNode');
    expect(result.instructions?.[0]).toStrictEqual(
        instructionNode({
            accounts: [
                instructionAccountNode({ identifier: 'from', isSigner: false, isWritable: true }),
                account('meta', accountValueNode('from')),
            ],
            data: structTypeNode([structFieldTypeNode({ identifier: 'lamports', type: integerTypeNode('u64') })]),
            identifier: 'send',
        }),
    );
});

test('it deletes an instruction matched by several entries', () => {
    // Given a program with one instruction.
    const node = programNode({
        identifier: 'myProgram',
        instructions: [instructionNode({ identifier: 'transfer' })],
        publicKey: '1111',
    });

    // When one entry updates it and another deletes it, then it is deleted.
    const result = visit(
        node,
        updateInstructionsVisitor({ 'myProgram.transfer': { delete: true }, transfer: { identifier: 'send' } }),
    );
    assertIsNode(result, 'programNode');
    expect(result.instructions).toBeUndefined();
});

test('it throws when replacing the type of a data field while updating its nested fields', () => {
    // Given an instruction whose data has a nested field.
    const node = instructionNode({
        data: structTypeNode([structFieldTypeNode({ identifier: 'config', type: structTypeNode([u8Field('fee')]) })]),
        identifier: 'ix',
    });

    // When we replace the type of the parent and rename the nested field, then we expect an error.
    expect(() =>
        visit(
            node,
            updateInstructionsVisitor({
                ix: {
                    data: {
                        config: { type: structTypeNode([u8Field('other')]) },
                        'config.fee': { identifier: 'feeBps' },
                    },
                },
            }),
        ),
    ).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__INSTRUCTION_DATA_FIELD_NOT_FOUND, {
            instruction: node,
            instructionName: identifierString('ix'),
            path: 'config.fee',
        }),
    );
});
