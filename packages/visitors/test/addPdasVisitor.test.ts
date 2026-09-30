import { CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES, CodamaError } from '@codama/errors';
import {
    constantPdaSeedNodeFromProgramId,
    constantPdaSeedNodeFromString,
    identifierString,
    pdaNode,
    pluginNode,
    programNode,
    publicKeyTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { addPdasVisitor } from '../src';

test('it adds PDA nodes to a program', () => {
    // Given a program with a single PDA.
    const node = programNode({
        identifier: 'myProgram',
        pdas: [
            pdaNode({
                identifier: 'associatedToken',
                seeds: [
                    variablePdaSeedNode('owner', publicKeyTypeNode()),
                    constantPdaSeedNodeFromProgramId(),
                    variablePdaSeedNode('mint', publicKeyTypeNode()),
                ],
            }),
        ],
        publicKey: 'Epo9rxh99jpeeWabRZi4tpgUVxZQeVn9vbbDjUztJtu4',
    });

    // When we add two more PDAs.
    const newPdas = [
        pdaNode({
            identifier: 'metadata',
            seeds: [
                constantPdaSeedNodeFromString('utf8', 'metadata'),
                constantPdaSeedNodeFromProgramId(),
                variablePdaSeedNode('mint', publicKeyTypeNode()),
            ],
        }),
        pdaNode({
            identifier: 'masterEdition',
            seeds: [
                constantPdaSeedNodeFromString('utf8', 'metadata'),
                constantPdaSeedNodeFromProgramId(),
                variablePdaSeedNode('mint', publicKeyTypeNode()),
                constantPdaSeedNodeFromString('utf8', 'edition'),
            ],
        }),
    ];
    const result = visit(node, addPdasVisitor({ myProgram: newPdas }));

    // Then we expect the following program to be returned.
    expect(result).toEqual({ ...node, pdas: [...(node.pdas ?? []), ...newPdas] });
});

test('it fails to add a PDA if its name conflicts with an existing PDA on the program', () => {
    // Given a program with a PDA named "myPda".
    const node = programNode({
        identifier: 'myProgram',
        pdas: [
            pdaNode({
                identifier: 'myPda',
                seeds: [
                    variablePdaSeedNode('owner', publicKeyTypeNode()),
                    constantPdaSeedNodeFromProgramId(),
                    variablePdaSeedNode('mint', publicKeyTypeNode()),
                ],
            }),
        ],
        publicKey: 'Epo9rxh99jpeeWabRZi4tpgUVxZQeVn9vbbDjUztJtu4',
    });

    // When we try to add another PDA with the same name.
    const fn = () =>
        visit(
            node,
            addPdasVisitor({
                myProgram: [
                    pdaNode({
                        identifier: 'myPda',
                        seeds: [
                            constantPdaSeedNodeFromString('utf8', 'metadata'),
                            constantPdaSeedNodeFromProgramId(),
                            variablePdaSeedNode('mint', publicKeyTypeNode()),
                        ],
                    }),
                ],
            }),
        );

    // Then we expect the following error to be thrown.
    expect(fn).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES, {
            duplicatedPdaNames: [identifierString('myPda')],
            program: node,
            programName: identifierString('myProgram'),
        }),
    );
});

test('it adds PDA nodes to a program with docs', () => {
    // Given a program with a single PDA.
    const node = programNode({
        identifier: 'myProgram',
        pdas: [
            pdaNode({
                identifier: 'associatedToken',
                seeds: [
                    variablePdaSeedNode('owner', publicKeyTypeNode()),
                    constantPdaSeedNodeFromProgramId(),
                    variablePdaSeedNode('mint', publicKeyTypeNode()),
                ],
            }),
        ],
        publicKey: 'Epo9rxh99jpeeWabRZi4tpgUVxZQeVn9vbbDjUztJtu4',
    });

    // When we add two more PDAs.
    const newPdas = [
        pdaNode({
            docs: 'Metadata for a token.',
            identifier: 'metadata',
            seeds: [
                constantPdaSeedNodeFromString('utf8', 'metadata'),
                constantPdaSeedNodeFromProgramId(),
                variablePdaSeedNode('mint', publicKeyTypeNode()),
            ],
        }),
        pdaNode({
            docs: 'The master edition.',
            identifier: 'masterEdition',
            seeds: [
                constantPdaSeedNodeFromString('utf8', 'metadata'),
                constantPdaSeedNodeFromProgramId(),
                variablePdaSeedNode('mint', publicKeyTypeNode()),
                constantPdaSeedNodeFromString('utf8', 'edition'),
            ],
        }),
    ];
    const result = visit(node, addPdasVisitor({ myProgram: newPdas }));

    // Then we expect the following program to be returned.
    expect(result).toEqual({ ...node, pdas: [...(node.pdas ?? []), ...newPdas] });
});

test('it fails to add a PDA whose identifier collides in camelCase with an existing PDA', () => {
    // Given a program with a PDA named "my_pda".
    const node = programNode({
        identifier: 'myProgram',
        pdas: [pdaNode({ identifier: 'my_pda', seeds: [constantPdaSeedNodeFromProgramId()] })],
        publicKey: 'Epo9rxh99jpeeWabRZi4tpgUVxZQeVn9vbbDjUztJtu4',
    });

    // When we try to add a PDA named "myPda".
    const fn = () =>
        visit(
            node,
            addPdasVisitor({ myProgram: [{ identifier: 'myPda', seeds: [constantPdaSeedNodeFromProgramId()] }] }),
        );

    // Then we expect a duplicated PDA error.
    expect(fn).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES, {
            duplicatedPdaNames: [identifierString('myPda')],
            program: node,
            programName: identifierString('myProgram'),
        }),
    );
});

test('it matches program identifiers exactly', () => {
    // Given a program with a snake_case identifier.
    const node = programNode({ identifier: 'my_program', publicKey: 'Epo9rxh99jpeeWabRZi4tpgUVxZQeVn9vbbDjUztJtu4' });
    const newPda = pdaNode({ identifier: 'myPda', seeds: [constantPdaSeedNodeFromProgramId()] });

    // When we add a PDA using a different casing, then nothing changes.
    expect(visit(node, addPdasVisitor({ myProgram: [newPda] }))).toStrictEqual(node);

    // When we add a PDA using the exact identifier, then it is added.
    expect(visit(node, addPdasVisitor({ my_program: [newPda] }))).toStrictEqual(
        programNode({ ...node, pdas: [newPda] }),
    );
});

test('it keeps the program ID and plugins of the new PDAs', () => {
    // Given a program and a PDA derived from another program, carrying plugins.
    const node = programNode({ identifier: 'myProgram', publicKey: 'Epo9rxh99jpeeWabRZi4tpgUVxZQeVn9vbbDjUztJtu4' });
    const newPda = pdaNode({
        identifier: 'associatedToken',
        plugins: [pluginNode('my.plugin', { answer: 42 })],
        programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
        seeds: [variablePdaSeedNode('owner', publicKeyTypeNode())],
    });

    // When we add the PDA.
    const result = visit(node, addPdasVisitor({ myProgram: [newPda] }));

    // Then it is added as is.
    expect(result).toStrictEqual(programNode({ ...node, pdas: [newPda] }));
});
