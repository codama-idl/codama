import { CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PROGRAM_NAMES, CodamaError } from '@codama/errors';
import { identifierString, pluginNode, programNode, rootNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { addProgramsVisitor } from '../src';

test.each([
    {
        existingIdentifier: 'myProgram',
        location: 'main program',
        newIdentifier: 'myProgram',
    },
    {
        existingIdentifier: 'my_program',
        location: 'main program',
        newIdentifier: 'myProgram',
    },
    {
        existingIdentifier: 'myProgram',
        location: 'additional program',
        newIdentifier: 'myProgram',
    },
    {
        existingIdentifier: 'my_program',
        location: 'additional program',
        newIdentifier: 'myProgram',
    },
    {
        existingIdentifier: 'myProgram',
        location: 'new program',
        newIdentifier: 'myProgram',
    },
    {
        existingIdentifier: 'my_program',
        location: 'new program',
        newIdentifier: 'myProgram',
    },
])(
    'it rejects $newIdentifier when it conflicts with $existingIdentifier in a $location',
    ({ location, existingIdentifier, newIdentifier }) => {
        // Given a conflicting identifier in the main, additional, or newly supplied programs.
        const publicKey = '11111111111111111111111111111111';
        const existingProgram = programNode({
            identifier: existingIdentifier,
            publicKey,
        });
        const mainProgram = programNode({ identifier: 'mainProgram', publicKey });
        const node = rootNode(location === 'main program' ? existingProgram : mainProgram, {
            additionalPrograms: location === 'additional program' ? [existingProgram] : [],
        });
        const originalNode = structuredClone(node);
        const newPrograms = [
            ...(location === 'new program' ? [existingProgram] : []),
            { identifier: newIdentifier, publicKey }, //additional program
        ];

        // When we try to add the conflicting program, then the specific error is thrown.
        expect.assertions(3);
        try {
            visit(node, addProgramsVisitor(newPrograms));
        } catch (error) {
            expect(error).toBeInstanceOf(CodamaError);
            expect(error).toMatchObject({
                context: {
                    __code: CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PROGRAM_NAMES,
                    duplicatedProgramNames: [identifierString(newIdentifier)],
                    path: [originalNode],
                },
            });
        }
        expect(node).toStrictEqual(originalNode);
    },
);

test('it reports all conflicting identifiers once without adding any programs', () => {
    // Given a root with a main program and an additional program.
    const publicKey = '11111111111111111111111111111111';
    const node = rootNode(programNode({ identifier: 'main_program', publicKey }), {
        additionalPrograms: [programNode({ identifier: 'existing_program', publicKey })],
    });
    const originalNode = structuredClone(node);

    // When the input includes several collisions and a non-conflicting program.
    const newPrograms = [
        { identifier: 'validProgram', publicKey },
        { identifier: 'mainProgram', publicKey },
        { identifier: 'existingProgram', publicKey },
        { identifier: 'another_program', publicKey },
        { identifier: 'anotherProgram', publicKey },
        { identifier: 'mainProgram', publicKey },
    ];

    // Then every conflicting identifier is reported once and nothing is appended.
    expect.assertions(3);
    try {
        visit(node, addProgramsVisitor(newPrograms));
    } catch (error) {
        expect(error).toBeInstanceOf(CodamaError);
        expect(error).toMatchObject({
            context: {
                __code: CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PROGRAM_NAMES,
                duplicatedProgramNames: [
                    identifierString('mainProgram'),
                    identifierString('existingProgram'),
                    identifierString('anotherProgram'),
                ],
                path: [originalNode],
            },
        });
    }
    expect(node).toStrictEqual(originalNode);
});

test('it keeps additional programs absent when the input is empty and the field is absent', () => {
    // Given a root with no additional programs field.
    const mainProgram = programNode({
        identifier: 'mainProgram',
        publicKey: '11111111111111111111111111111111',
    });
    const node = rootNode(mainProgram);
    expect(node).not.toHaveProperty('additionalPrograms');

    // When we add no programs.
    const result = visit(node, addProgramsVisitor([]));

    // Then the field stays absent and the original root is unchanged.
    expect(result).toStrictEqual(node);
    expect(result).not.toHaveProperty('additionalPrograms');
    expect(result.program).toBe(mainProgram);
    expect(node).not.toHaveProperty('additionalPrograms');
});

test('it preserves existing programs when the input is empty', () => {
    // Given a root with a main program and one additional program.
    const publicKey = '11111111111111111111111111111111';
    const mainProgram = programNode({ identifier: 'mainProgram', publicKey });
    const existingProgram = programNode({
        identifier: 'existingProgram',
        publicKey,
    });
    const node = rootNode(mainProgram, { additionalPrograms: [existingProgram] });

    // When we add no programs.
    const result = visit(node, addProgramsVisitor([]));

    // Then the root's contents and the original input are unchanged.
    expect(result).toStrictEqual(node);
    expect(result.program).toBe(mainProgram);
    expect(node.additionalPrograms).toStrictEqual([existingProgram]);
});

test('it returns a frozen root and preserves root plugins when adding programs', () => {
    // Given a root with a plugin.
    const publicKey = '11111111111111111111111111111111';
    const mainProgram = programNode({ identifier: 'mainProgram', publicKey });
    const plugins = [pluginNode('my.plugin', { answer: 42 })];
    const node = rootNode(mainProgram, { plugins });

    // When we add a program.
    const newProgram = programNode({ identifier: 'newProgram', publicKey });
    const result = visit(node, addProgramsVisitor([newProgram]));

    // Then the result is frozen and retains the root's plugins.
    expect(Object.isFrozen(result)).toBe(true);
    expect(result).toStrictEqual(rootNode(mainProgram, { additionalPrograms: [newProgram], plugins }));
    expect(node).toStrictEqual(rootNode(mainProgram, { plugins }));
});

test('it adds programs to a root with no additional programs', () => {
    // Given a root with only a main program.
    const publicKey = '11111111111111111111111111111111';
    const mainProgram = programNode({ identifier: 'mainProgram', publicKey });
    const node = rootNode(mainProgram);
    expect(node).not.toHaveProperty('additionalPrograms');

    // When we add two programs.
    const newPrograms = [
        { identifier: 'firstProgram', publicKey },
        { identifier: 'secondProgram', publicKey },
    ];
    const result = visit(node, addProgramsVisitor(newPrograms));

    // Then the new array is created without changing the original root.
    expect(result).toStrictEqual({
        ...node,
        additionalPrograms: newPrograms.map(program => programNode(program)),
    });
    expect(result.program).toBe(mainProgram);
    expect(node.additionalPrograms).toBeUndefined();
    expect(node).not.toHaveProperty('additionalPrograms');
});

test('it adds more additional programs', () => {
    // Given a root with a main program and one additional program.
    const publicKey = '11111111111111111111111111111111';
    const mainProgram = programNode({ identifier: 'mainProgram', publicKey });
    const existingProgram = programNode({
        identifier: 'existingProgram',
        publicKey,
    });
    const node = rootNode(mainProgram, { additionalPrograms: [existingProgram] });

    // When we add two programs using constructor inputs.
    const newPrograms = [
        { identifier: 'firstProgram', publicKey },
        { identifier: 'secondProgram', publicKey },
    ];
    const result = visit(node, addProgramsVisitor(newPrograms));

    // Then the programs are appended in order and the original root is unchanged.
    expect(result).toStrictEqual({
        ...node,
        additionalPrograms: [existingProgram, ...newPrograms.map(program => programNode(program))],
    });
    expect(result.program).toBe(mainProgram);
    expect(node.additionalPrograms).toStrictEqual([existingProgram]);
});
