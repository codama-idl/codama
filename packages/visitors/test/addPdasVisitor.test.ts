import {
    constantPdaSeedNodeFromProgramId,
    constantPdaSeedNodeFromString,
    pdaNode,
    programNode,
    publicKeyTypeNode,
    variablePdaSeedNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import test from 'ava';

import { addPdasVisitor } from '../src/index.js';

test('it adds PDA nodes to a program', t => {
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
    t.deepEqual(result, { ...node, pdas: [...node.pdas, ...newPdas] });
});

test('it fails to add a PDA if its name conflicts with an existing PDA on the program', t => {
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
    t.throws(fn, {
        message: 'Cannot add PDAs to program "myProgram" because the following PDA names already exist: myPda.',
    });
});
