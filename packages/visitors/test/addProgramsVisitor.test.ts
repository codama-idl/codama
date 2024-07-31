import { KINOBI_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_ADDITIONAL_PROGRAMS, KinobiError } from '@kinobi-so/errors';
import {
    programNode,
    rootNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { expect, test } from 'vitest';

import { addProgramsVisitor } from '../src';

test('it adds PDA nodes to a program', () => {
    // Given a root node with a program.
    const node = rootNode(
        programNode({
            name: 'myProgram',
            publicKey: 'Epo9rxh99jpeeWabRZi4tpgUVxZQeVn9vbbDjUztJtu4',
        })
    );

    // When we add two more programs..
    const additionalPrograms = [
        programNode({
            name: 'system',
            publicKey: '11111111111111111111111111111111',
        }),
        programNode({
            name: 'token',
            publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        })
    ];
    const result = visit(node, addProgramsVisitor(additionalPrograms));

    // Then we expect the following program to be returned.
    expect(result).toEqual({ ...node, additionalPrograms: [...node.additionalPrograms, ...additionalPrograms] });
});

test('it fails to add a PDA if its name conflicts with an existing PDA on the program', () => {
    // Given a root node with a program and an additional program.
    const node = rootNode(
        programNode({
            name: 'myProgram',
            publicKey: 'Epo9rxh99jpeeWabRZi4tpgUVxZQeVn9vbbDjUztJtu4',
        }),
        [
            programNode({
                name: 'system',
                publicKey: '11111111111111111111111111111111',
            })
        ]
    );

    // We try to add two programs, one of which already exists on additionalPrograms
    const additionalPrograms = [
        programNode({
            name: 'system',
            publicKey: '11111111111111111111111111111111',
        }),
        programNode({
            name: 'token',
            publicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        })
    ];
    const fn = () => visit(node, addProgramsVisitor(additionalPrograms));

    // Then we expect the following error to be thrown.
    expect(fn).toThrow(
        new KinobiError(KINOBI_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_ADDITIONAL_PROGRAMS, {
            duplicatedProgramPublicKeys: ['11111111111111111111111111111111'],
            program: node.program,
            programName: 'myProgram',
        }),
    );
});
