import {
    accountNode,
    assertIsNode,
    CamelCaseString,
    constantPdaSeedNodeFromString,
    numberTypeNode,
    pdaLinkNode,
    pdaNode,
    programNode,
    resolveNestedTypeNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { expect, test } from 'vitest';

import { updateAccountsVisitor } from '../src';

test('it updates the name of an account', () => {
    // Given the following program node with one account.
    const node = programNode({
        accounts: [accountNode({ name: 'myAccount' })],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we update the name of that account.
    const result = visit(
        node,
        updateAccountsVisitor({
            myAccount: { name: 'myNewAccount' },
        }),
    );

    // Then we expect the following tree changes.
    assertIsNode(result, 'programNode');
    expect(result.accounts[0].name).toBe('myNewAccount' as CamelCaseString);
});

test('it updates the name of an account within a specific program', () => {
    // Given two programs each with an account of the same name.
    const node = rootNode(
        programNode({
            accounts: [accountNode({ name: 'candyMachine' })],
            name: 'myProgramA',
            publicKey: '1111',
        }),
        [
            programNode({
                accounts: [accountNode({ name: 'candyMachine' })],
                name: 'myProgramB',
                publicKey: '2222',
            }),
        ],
    );

    // When we update the name of that account in the first program.
    const result = visit(
        node,
        updateAccountsVisitor({
            'myProgramA.candyMachine': { name: 'newCandyMachine' },
        }),
    );

    // Then we expect the first account to have been renamed.
    assertIsNode(result, 'rootNode');
    expect(result.program.accounts[0].name).toBe('newCandyMachine' as CamelCaseString);

    // But not the second account.
    expect(result.additionalPrograms[0].accounts[0].name).toBe('candyMachine' as CamelCaseString);
});

test("it renames the fields of an account's data", () => {
    // Given the following account.
    const node = accountNode({
        data: structTypeNode([structFieldTypeNode({ name: 'myData', type: numberTypeNode('u32') })]),
        name: 'myAccount',
    });

    // When we rename its data fields.
    const result = visit(
        node,
        updateAccountsVisitor({
            myAccount: {
                data: { myData: 'myNewData' },
            },
        }),
    );

    // Then we expect the following tree changes.
    assertIsNode(result, 'accountNode');
    const data = resolveNestedTypeNode(result.data);
    expect(data.fields[0].name).toBe('myNewData' as CamelCaseString);
});

test('it updates the name of associated PDA nodes', () => {
    // Given the following program node with one account
    // and PDA accounts such that one of them is named the same.
    const node = programNode({
        accounts: [accountNode({ name: 'myAccount' })],
        name: 'myProgram',
        pdas: [pdaNode({ name: 'myAccount', seeds: [] }), pdaNode({ name: 'myOtherAccount', seeds: [] })],
        publicKey: '1111',
    });

    // When we update the name of that account.
    const result = visit(
        node,
        updateAccountsVisitor({
            myAccount: { name: 'myNewAccount' },
        }),
    );

    // Then we expect the associated PDA node to have been renamed.
    assertIsNode(result, 'programNode');
    expect(result.pdas[0].name).toBe('myNewAccount' as CamelCaseString);

    // But not the other PDA node.
    expect(result.pdas[1].name).toBe('myOtherAccount' as CamelCaseString);
});

test('it creates a new PDA node when providing seeds to an account with no linked PDA', () => {
    // Given the following program node with one account.
    const node = rootNode(
        programNode({
            accounts: [accountNode({ name: 'myAccount' })],
            name: 'myProgramA',
            pdas: [],
            publicKey: '1111',
        }),
        [programNode({ name: 'myProgramB', publicKey: '2222' })],
    );

    // When we update the account with PDA seeds.
    const seeds = [constantPdaSeedNodeFromString('utf8', 'myAccount')];
    const result = visit(
        node,
        updateAccountsVisitor({
            myAccount: { seeds },
        }),
    );
    assertIsNode(result, 'rootNode');

    // Then we expect a new PDA node to have been created on the program.
    expect(result.program.pdas.length).toBe(1);
    expect(result.additionalPrograms[0].pdas.length).toBe(0);
    expect(result.program.pdas[0]).toEqual(pdaNode({ name: 'myAccount', seeds }));

    // And the account now links to the new PDA node.
    expect(result.program.accounts[0].pda).toEqual(pdaLinkNode('myAccount'));
});

test('it updates the PDA node when the updated account name matches an existing PDA node', () => {
    // Given an account node and a PDA node with the same name
    // such that the account is not linked to the PDA.
    const node = programNode({
        accounts: [accountNode({ name: 'myAccount' })],
        name: 'myProgram',
        pdas: [pdaNode({ name: 'myAccount', seeds: [] })],
        publicKey: '1111',
    });

    // When we update the account with PDA seeds.
    const seeds = [constantPdaSeedNodeFromString('utf8', 'myAccount')];
    const result = visit(
        node,
        updateAccountsVisitor({
            myAccount: { seeds },
        }),
    );
    assertIsNode(result, 'programNode');

    // Then we expect the PDA node with the same name to have been updated.
    expect(result.pdas.length).toBe(1);
    expect(result.pdas[0]).toEqual(pdaNode({ name: 'myAccount', seeds }));

    // And the account now links to this PDA node.
    expect(result.accounts[0].pda).toEqual(pdaLinkNode('myAccount'));
});

test('it updates the PDA node with the provided seeds when an account is linked to a PDA', () => {
    // Given an account node and a PDA node with a different name
    // such that the account is linked to the PDA.
    const node = programNode({
        accounts: [accountNode({ name: 'myAccount', pda: pdaLinkNode('myPda') })],
        name: 'myProgram',
        pdas: [pdaNode({ name: 'myPda', seeds: [] })],
        publicKey: '1111',
    });

    // When we update the account with PDA seeds.
    const seeds = [constantPdaSeedNodeFromString('utf8', 'myAccount')];
    const result = visit(
        node,
        updateAccountsVisitor({
            myAccount: { seeds },
        }),
    );
    assertIsNode(result, 'programNode');

    // Then we expect the linked PDA node to have been updated.
    expect(result.pdas.length).toBe(1);
    expect(result.pdas[0]).toEqual(pdaNode({ name: 'myPda', seeds }));

    // And the account still links to the PDA node.
    expect(result.accounts[0].pda).toEqual(pdaLinkNode('myPda'));
});

test('it creates a new PDA node when updating an account with seeds and a new linked PDA that does not exist', () => {
    // Given an account node with no linked PDA.
    const node = programNode({
        accounts: [accountNode({ name: 'myAccount' })],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we update the account with PDA seeds and a new linked PDA node.
    const seeds = [constantPdaSeedNodeFromString('utf8', 'myAccount')];
    const result = visit(
        node,
        updateAccountsVisitor({
            myAccount: {
                pda: pdaLinkNode('myPda'),
                seeds,
            },
        }),
    );
    assertIsNode(result, 'programNode');

    // Then we expect the linked PDA node to have been created.
    expect(result.pdas.length).toBe(1);
    expect(result.pdas[0]).toEqual(pdaNode({ name: 'myPda', seeds }));

    // And the account now links to the PDA node.
    expect(result.accounts[0].pda).toEqual(pdaLinkNode('myPda'));
});

test('it updates a PDA node when updating an account with seeds and a new linked PDA that exists', () => {
    // Given an account node with no linked PDA and an existing PDA node.
    const node = programNode({
        accounts: [accountNode({ name: 'myAccount' })],
        name: 'myProgram',
        pdas: [pdaNode({ name: 'myPda', seeds: [] })],
        publicKey: '1111',
    });

    // When we update the account with PDA seeds and a linked PDA node that points to the existing PDA.
    const seeds = [constantPdaSeedNodeFromString('utf8', 'myAccount')];
    const result = visit(
        node,
        updateAccountsVisitor({
            myAccount: {
                pda: pdaLinkNode('myPda'),
                seeds,
            },
        }),
    );
    assertIsNode(result, 'programNode');

    // Then we expect the existing PDA node to have been updated.
    expect(result.pdas.length).toBe(1);
    expect(result.pdas[0]).toEqual(pdaNode({ name: 'myPda', seeds }));

    // And the account now links to this PDA node.
    expect(result.accounts[0].pda).toEqual(pdaLinkNode('myPda'));
});

test('it can update the seeds and name of an account at the same time', () => {
    // Given an account node with no linked PDA.
    const node = programNode({
        accounts: [accountNode({ name: 'myAccount' })],
        name: 'myProgram',
        publicKey: '1111',
    });

    // When we update the name and seeds of the account.
    const seeds = [constantPdaSeedNodeFromString('utf8', 'myAccount')];
    const result = visit(
        node,
        updateAccountsVisitor({
            myAccount: {
                name: 'myNewAccount',
                seeds,
            },
        }),
    );
    assertIsNode(result, 'programNode');

    // Then we expect the account name to have been updated.
    expect(result.accounts[0].name).toBe('myNewAccount' as CamelCaseString);

    // And a new PDA node to have been created with that new name and the provided seeds.
    expect(result.pdas.length).toBe(1);
    expect(result.pdas[0]).toEqual(pdaNode({ name: 'myNewAccount', seeds }));

    // And the account to now link to the PDA node.
    expect(result.accounts[0].pda).toEqual(pdaLinkNode('myNewAccount'));
});
