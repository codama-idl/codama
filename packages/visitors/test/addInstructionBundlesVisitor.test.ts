import {
    KINOBI_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_INSTRUCTION_BUNDLE_NAMES,
    KinobiError
} from '@kinobi-so/errors';
import {
    instructionBundleNode,
    programNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { expect, test } from 'vitest';

import { addInstructionBundlesVisitor } from '../src/addInstructionBundlesVisitor';

test('it adds instruction bundle nodes to a program', () => {
    // Given a program with no instruction bundles
    const node = programNode({
        name: 'myProgram',
        publicKey: 'Epo9rxh99jpeeWabRZi4tpgUVxZQeVn9vbbDjUztJtu4',
    });

    // When we add two instruction bundles.
    const newBundles = [
        instructionBundleNode({
            instructions: [],
            name: 'myBundle',
        }),
        instructionBundleNode({
            instructions: [],
            name: 'mySecondBundle',
        }),
    ];

    const result = visit(node, addInstructionBundlesVisitor({ myProgram: newBundles }));

    // Then we expect the following program to be returned.
    expect(result).toEqual({ ...node, instructionBundles: [...(node.instructionBundles ?? []), ...newBundles] });
});

test('it fails to add an instruction bundle if its name conflicts with an existing instruction bundle on the program', () => {
    // Given a program with an instruction bundle named "myBundle"
    const node = programNode({
        instructionBundles: [
            instructionBundleNode({
                instructions: [],
                name: 'myBundle',
            }),
        ],
        name: 'myProgram',
        publicKey: 'Epo9rxh99jpeeWabRZi4tpgUVxZQeVn9vbbDjUztJtu4',
    });

    // When we add an instruction bundle with the same name
    const newBundle = instructionBundleNode({
        instructions: [],
        name: 'myBundle',
    });

    const fn = () => visit(node, addInstructionBundlesVisitor({ myProgram: newBundle }));

    // Then we expect the following error to be thrown.
    expect(fn).toThrow(
        new KinobiError(KINOBI_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_INSTRUCTION_BUNDLE_NAMES, {
            duplicatedInstructionBundleNames: ['myBundle'],
            program: node,
            programName: 'myProgram',
        }),
    );
});
