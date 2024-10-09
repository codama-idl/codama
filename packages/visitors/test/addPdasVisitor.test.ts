import { CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES, CodamaError } from '@codama/errors';
import {
    constantPdaSeedNodeFromProgramId,
    constantPdaSeedNodeFromString,
    pdaNode,
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
        name: 'myProgram',
        pdas: [
            pdaNode({
                name: 'associatedToken',
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
            name: 'metadata',
            seeds: [
                constantPdaSeedNodeFromString('utf8', 'metadata'),
                constantPdaSeedNodeFromProgramId(),
                variablePdaSeedNode('mint', publicKeyTypeNode()),
            ],
        }),
        pdaNode({
            name: 'masterEdition',
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
    expect(result).toEqual({ ...node, pdas: [...node.pdas, ...newPdas] });
});

test('it fails to add a PDA if its name conflicts with an existing PDA on the program', () => {
    // Given a program with a PDA named "myPda".
    const node = programNode({
        name: 'myProgram',
        pdas: [
            pdaNode({
                name: 'myPda',
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
                        name: 'myPda',
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
            duplicatedPdaNames: ['myPda'],
            program: node,
            programName: 'myProgram',
        }),
    );
});
