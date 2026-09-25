import {
    CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND,
    CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS,
    CodamaError,
} from '@codama/errors';
import {
    accountDataValueNode,
    accountLinkNode,
    accountNode,
    assertIsNode,
    constantPdaSeedNodeFromString,
    fieldDiscriminatorNode,
    identifierString,
    instructionAccountNode,
    instructionNode,
    integerTypeNode,
    pdaLinkNode,
    pdaNode,
    programLinkNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { updateAccountsVisitor } from '../src';

const seeds = [constantPdaSeedNodeFromString('utf8', 'myAccount')];

test('it updates the identifier of an account', () => {
    // Given the following program node with one account.
    const node = programNode({
        accounts: [accountNode({ identifier: 'myAccount' })],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we update the identifier of that account.
    const result = visit(node, updateAccountsVisitor({ myAccount: { identifier: 'myNewAccount' } }));

    // Then we expect the account to be renamed.
    assertIsNode(result, 'programNode');
    expect(result.accounts?.[0].identifier).toBe('myNewAccount');
});

test('it updates the identifier of an account within a specific program', () => {
    // Given two programs each with an account of the same identifier.
    const node = rootNode(
        programNode({
            accounts: [accountNode({ identifier: 'candyMachine' })],
            identifier: 'myProgramA',
            publicKey: '1111',
        }),
        {
            additionalPrograms: [
                programNode({
                    accounts: [accountNode({ identifier: 'candyMachine' })],
                    identifier: 'myProgramB',
                    publicKey: '2222',
                }),
            ],
        },
    );

    // When we update the identifier of that account in the first program.
    const result = visit(node, updateAccountsVisitor({ 'myProgramA.candyMachine': { identifier: 'newCandyMachine' } }));

    // Then we expect the first account to have been renamed but not the second one.
    assertIsNode(result, 'rootNode');
    expect(result.program.accounts?.[0].identifier).toBe('newCandyMachine');
    expect(result.additionalPrograms?.[0].accounts?.[0].identifier).toBe('candyMachine');
});

test("it renames the fields of an account's data and keeps its transforms", () => {
    // Given the following account.
    const node = accountNode({
        data: structTypeNode([structFieldTypeNode({ identifier: 'myData', type: integerTypeNode('u32') })]),
        identifier: 'myAccount',
    });

    // When we rename its data fields.
    const result = visit(node, updateAccountsVisitor({ myAccount: { data: { myData: 'myNewData' } } }));

    // Then we expect the field to be renamed.
    expect(result).toStrictEqual(
        accountNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'myNewData', type: integerTypeNode('u32') })]),
            identifier: 'myAccount',
        }),
    );
});

test('it updates the identifier of associated PDA nodes', () => {
    // Given a program with one account and PDAs such that one of them shares its identifier.
    const node = programNode({
        accounts: [accountNode({ identifier: 'myAccount', pda: pdaLinkNode('myAccount') })],
        identifier: 'myProgram',
        pdas: [pdaNode({ identifier: 'myAccount', seeds: [] }), pdaNode({ identifier: 'myOtherAccount', seeds: [] })],
        publicKey: '1111',
    });

    // When we update the identifier of that account.
    const result = visit(node, updateAccountsVisitor({ myAccount: { identifier: 'myNewAccount' } }));

    // Then we expect the associated PDA node and its link to have been renamed, but not the other PDA node.
    assertIsNode(result, 'programNode');
    expect(result.pdas?.map(pda => pda.identifier)).toStrictEqual(['myNewAccount', 'myOtherAccount']);
    expect(result.accounts?.[0].pda).toStrictEqual(pdaLinkNode('myNewAccount'));
});

test('it creates a new PDA node when providing seeds to an account with no linked PDA', () => {
    // Given a program with one account and another program.
    const node = rootNode(
        programNode({
            accounts: [accountNode({ identifier: 'myAccount' })],
            identifier: 'myProgramA',
            publicKey: '1111',
        }),
        { additionalPrograms: [programNode({ identifier: 'myProgramB', publicKey: '2222' })] },
    );

    // When we update the account with PDA seeds.
    const result = visit(node, updateAccountsVisitor({ myAccount: { seeds } }));
    assertIsNode(result, 'rootNode');

    // Then we expect a new PDA node to have been created on the program of the account.
    expect(result.program.pdas).toStrictEqual([pdaNode({ identifier: 'myAccount', seeds })]);
    expect(result.additionalPrograms?.[0].pdas).toBeUndefined();

    // And the account now links to the new PDA node.
    expect(result.program.accounts?.[0].pda).toStrictEqual(pdaLinkNode('myAccount'));
});

test('it updates the PDA node when the account identifier matches an existing PDA node', () => {
    // Given an account node and a PDA node with the same identifier, not linked together.
    const node = programNode({
        accounts: [accountNode({ identifier: 'myAccount' })],
        identifier: 'myProgram',
        pdas: [pdaNode({ docs: 'My PDA.', identifier: 'myAccount', seeds: [] })],
        publicKey: '1111',
    });

    // When we update the account with PDA seeds.
    const result = visit(node, updateAccountsVisitor({ myAccount: { seeds } }));
    assertIsNode(result, 'programNode');

    // Then we expect the PDA node with the same identifier to have been updated, keeping its docs.
    expect(result.pdas).toStrictEqual([pdaNode({ docs: 'My PDA.', identifier: 'myAccount', seeds })]);

    // And the account now links to this PDA node.
    expect(result.accounts?.[0].pda).toStrictEqual(pdaLinkNode('myAccount'));
});

test('it updates the PDA node with the provided seeds when an account is linked to a PDA', () => {
    // Given an account node linked to a PDA with a different identifier.
    const node = programNode({
        accounts: [accountNode({ identifier: 'myAccount', pda: pdaLinkNode('myPda') })],
        identifier: 'myProgram',
        pdas: [pdaNode({ identifier: 'myPda', seeds: [] })],
        publicKey: '1111',
    });

    // When we update the account with PDA seeds.
    const result = visit(node, updateAccountsVisitor({ myAccount: { seeds } }));
    assertIsNode(result, 'programNode');

    // Then we expect the linked PDA node to have been updated and still be linked.
    expect(result.pdas).toStrictEqual([pdaNode({ identifier: 'myPda', seeds })]);
    expect(result.accounts?.[0].pda).toStrictEqual(pdaLinkNode('myPda'));
});

test('it creates a new PDA node when updating an account with seeds and a new linked PDA that does not exist', () => {
    // Given an account node with no linked PDA.
    const node = programNode({
        accounts: [accountNode({ identifier: 'myAccount' })],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we update the account with PDA seeds and a new linked PDA node.
    const result = visit(node, updateAccountsVisitor({ myAccount: { pda: pdaLinkNode('myPda'), seeds } }));
    assertIsNode(result, 'programNode');

    // Then we expect the linked PDA node to have been created and linked.
    expect(result.pdas).toStrictEqual([pdaNode({ identifier: 'myPda', seeds })]);
    expect(result.accounts?.[0].pda).toStrictEqual(pdaLinkNode('myPda'));
});

test('it updates a PDA node when updating an account with seeds and a new linked PDA that exists', () => {
    // Given an account node with no linked PDA and an existing PDA node.
    const node = programNode({
        accounts: [accountNode({ identifier: 'myAccount' })],
        identifier: 'myProgram',
        pdas: [pdaNode({ identifier: 'myPda', seeds: [] })],
        publicKey: '1111',
    });

    // When we update the account with PDA seeds and a linked PDA node that points to the existing PDA.
    const result = visit(node, updateAccountsVisitor({ myAccount: { pda: pdaLinkNode('myPda'), seeds } }));
    assertIsNode(result, 'programNode');

    // Then we expect the existing PDA node to have been updated and linked.
    expect(result.pdas).toStrictEqual([pdaNode({ identifier: 'myPda', seeds })]);
    expect(result.accounts?.[0].pda).toStrictEqual(pdaLinkNode('myPda'));
});

test('it creates the PDA in the program of the provided PDA link', () => {
    // Given an account in a program and another program without PDAs.
    const node = rootNode(
        programNode({
            accounts: [accountNode({ identifier: 'myAccount' })],
            identifier: 'myProgramA',
            publicKey: '1111',
        }),
        { additionalPrograms: [programNode({ identifier: 'myProgramB', publicKey: '2222' })] },
    );

    // When we update the account with PDA seeds and a PDA link to the other program.
    const pda = pdaLinkNode('myPda', { program: programLinkNode('myProgramB') });
    const result = visit(node, updateAccountsVisitor({ myAccount: { pda, seeds } }));
    assertIsNode(result, 'rootNode');

    // Then the PDA is created in that other program.
    expect(result.program.pdas).toBeUndefined();
    expect(result.additionalPrograms?.[0].pdas).toStrictEqual([pdaNode({ identifier: 'myPda', seeds })]);
    expect(result.program.accounts?.[0].pda).toStrictEqual(pda);
});

test('it can update the seeds and identifier of an account at the same time', () => {
    // Given an account node with no linked PDA.
    const node = programNode({
        accounts: [accountNode({ identifier: 'myAccount' })],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we update the identifier and seeds of the account.
    const result = visit(node, updateAccountsVisitor({ myAccount: { identifier: 'myNewAccount', seeds } }));
    assertIsNode(result, 'programNode');

    // Then we expect the account to be renamed and linked to a new PDA named after it.
    expect(result.accounts?.[0].identifier).toBe('myNewAccount');
    expect(result.pdas).toStrictEqual([pdaNode({ identifier: 'myNewAccount', seeds })]);
    expect(result.accounts?.[0].pda).toStrictEqual(pdaLinkNode('myNewAccount'));
});

test('it repoints account links to the renamed account only', () => {
    // Given two programs with same-named accounts, linked from instruction accounts of the first program.
    const programA = programNode({
        accounts: [accountNode({ identifier: 'vault' })],
        identifier: 'programA',
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        accountLink: accountLinkNode('vault'),
                        identifier: 'localVault',
                        isSigner: false,
                        isWritable: true,
                    }),
                    instructionAccountNode({
                        accountLink: accountLinkNode('vault', { program: programLinkNode('programB') }),
                        identifier: 'remoteVault',
                        isSigner: false,
                        isWritable: true,
                    }),
                ],
                identifier: 'deposit',
            }),
        ],
        publicKey: '1111',
    });
    const programB = programNode({
        accounts: [accountNode({ identifier: 'vault' })],
        identifier: 'programB',
        publicKey: '2222',
    });

    // When we rename the account of the second program.
    const result = visit(
        rootNode(programA, { additionalPrograms: [programB] }),
        updateAccountsVisitor({ 'programB.vault': { identifier: 'remoteVault' } }),
    );

    // Then only the link pointing to that account is renamed.
    assertIsNode(result, 'rootNode');
    const [local, remote] = result.program.instructions?.[0].accounts ?? [];
    expect(local.accountLink).toStrictEqual(accountLinkNode('vault'));
    expect(remote.accountLink).toStrictEqual(accountLinkNode('remoteVault', { program: programLinkNode('programB') }));
});

test('it repoints paths to renamed data fields', () => {
    // Given an account discriminated by a data field, read by an instruction account.
    const node = programNode({
        accounts: [
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'key', type: integerTypeNode('u8') }),
                    structFieldTypeNode({ identifier: 'owner', type: integerTypeNode('u64') }),
                ]),
                discriminators: [fieldDiscriminatorNode('key')],
                identifier: 'vault',
            }),
        ],
        identifier: 'myProgram',
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        accountLink: accountLinkNode('vault'),
                        identifier: 'vault',
                        isSigner: false,
                        isWritable: false,
                    }),
                    instructionAccountNode({
                        defaultValue: accountDataValueNode('vault', { path: 'owner' }),
                        identifier: 'owner',
                        isSigner: true,
                        isWritable: false,
                    }),
                ],
                identifier: 'withdraw',
            }),
        ],
        publicKey: '1111',
    });

    // When we rename both data fields.
    const result = visit(node, updateAccountsVisitor({ vault: { data: { key: 'accountKey', owner: 'authority' } } }));

    // Then the discriminator and the account data value point to the new fields.
    assertIsNode(result, 'programNode');
    expect(result.accounts?.[0].discriminators).toStrictEqual([fieldDiscriminatorNode('accountKey')]);
    expect(result.instructions?.[0].accounts?.[1].defaultValue).toStrictEqual(
        accountDataValueNode('vault', { path: 'authority' }),
    );
});

test('it throws when renaming a data field that does not exist', () => {
    // Given an account without a "missing" field.
    const account = accountNode({
        data: structTypeNode([structFieldTypeNode({ identifier: 'key', type: integerTypeNode('u8') })]),
        identifier: 'myAccount',
    });

    // When we try to rename it, then we expect an error.
    expect(() => visit(account, updateAccountsVisitor({ myAccount: { data: { missing: 'other' } } }))).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND, {
            account,
            missingField: identifierString('missing'),
            name: identifierString('myAccount'),
        }),
    );
});

test('it throws on unrecognized update keys', () => {
    // When we use the v1 `name` key, then we expect an error when creating the visitor.
    expect(() => updateAccountsVisitor({ myAccount: { name: 'myNewAccount' } as never })).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS, {
            allowedKeys: ['data', 'discriminators', 'docs', 'identifier', 'pda', 'plugins', 'seeds', 'size'],
            selector: 'myAccount',
            unrecognizedKeys: ['name'],
        }),
    );
});

test('it deletes accounts', () => {
    // Given a program with two accounts.
    const node = programNode({
        accounts: [accountNode({ identifier: 'a' }), accountNode({ identifier: 'b' })],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we delete one of them.
    const result = visit(node, updateAccountsVisitor({ a: { delete: true } }));

    // Then only the other one remains.
    assertIsNode(result, 'programNode');
    expect(result.accounts?.map(account => account.identifier)).toStrictEqual(['b']);
});

test('it merges updates from several entries matching the same account', () => {
    // Given an account with two data fields.
    const node = programNode({
        accounts: [
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'a', type: integerTypeNode('u8') }),
                    structFieldTypeNode({ identifier: 'b', type: integerTypeNode('u8') }),
                ]),
                discriminators: [fieldDiscriminatorNode('a')],
                identifier: 'myAccount',
            }),
        ],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When two entries rename its fields and the account itself, using original identifiers.
    const result = visit(
        node,
        updateAccountsVisitor({
            myAccount: { data: { b: 'y' } },
            'myProgram.myAccount': { data: { a: 'x' }, identifier: 'renamed' },
        }),
    );

    // Then every rename is applied and the discriminator is repointed.
    assertIsNode(result, 'programNode');
    expect(result.accounts?.[0]).toStrictEqual(
        accountNode({
            data: structTypeNode([
                structFieldTypeNode({ identifier: 'x', type: integerTypeNode('u8') }),
                structFieldTypeNode({ identifier: 'y', type: integerTypeNode('u8') }),
            ]),
            discriminators: [fieldDiscriminatorNode('x')],
            identifier: 'renamed',
        }),
    );
});

test('it creates the PDA in a program visited before the account', () => {
    // Given an account in an additional program, and the main program without PDAs.
    const node = rootNode(programNode({ identifier: 'myProgramA', publicKey: '1111' }), {
        additionalPrograms: [
            programNode({
                accounts: [accountNode({ identifier: 'myAccount' })],
                identifier: 'myProgramB',
                publicKey: '2222',
            }),
        ],
    });

    // When we update the account with PDA seeds and a PDA link to the main program.
    const pda = pdaLinkNode('myPda', { program: programLinkNode('myProgramA') });
    const result = visit(node, updateAccountsVisitor({ myAccount: { pda, seeds } }));
    assertIsNode(result, 'rootNode');

    // Then the PDA is created in the main program.
    expect(result.program.pdas).toStrictEqual([pdaNode({ identifier: 'myPda', seeds })]);
    expect(result.additionalPrograms?.[0].pdas).toBeUndefined();
});

test('it lets the last account win when several accounts update the same PDA', () => {
    // Given two accounts linked to the same PDA.
    const node = programNode({
        accounts: [
            accountNode({ identifier: 'first', pda: pdaLinkNode('shared') }),
            accountNode({ identifier: 'second', pda: pdaLinkNode('shared') }),
        ],
        identifier: 'myProgram',
        pdas: [pdaNode({ identifier: 'shared', seeds: [] })],
        publicKey: '1111',
    });

    // When both accounts update its seeds.
    const otherSeeds = [constantPdaSeedNodeFromString('utf8', 'other')];
    const result = visit(node, updateAccountsVisitor({ first: { seeds }, second: { seeds: otherSeeds } }));

    // Then the PDA gets the seeds of the last account.
    assertIsNode(result, 'programNode');
    expect(result.pdas).toStrictEqual([pdaNode({ identifier: 'shared', seeds: otherSeeds })]);
});
