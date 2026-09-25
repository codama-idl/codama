import { CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS, CodamaError } from '@codama/errors';
import {
    accountNode,
    assertIsNode,
    definedTypeLinkNode,
    definedTypeNode,
    integerTypeNode,
    programLinkNode,
    programNode,
    rootNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { updateProgramsVisitor } from '../src';

test('it updates programs and renames links to them', () => {
    // Given a program linking to a type of another program.
    const programA = programNode({
        accounts: [
            accountNode({
                data: definedTypeLinkNode('myType', { program: programLinkNode('splToken') }),
                identifier: 'myAccount',
            }),
        ],
        identifier: 'myProgram',
        publicKey: '1111',
    });
    const programB = programNode({
        definedTypes: [definedTypeNode({ identifier: 'myType', type: integerTypeNode('u8') })],
        identifier: 'splToken',
        publicKey: '2222',
    });

    // When we rename and update the second program.
    const result = visit(
        rootNode(programA, { additionalPrograms: [programB] }),
        updateProgramsVisitor({ splToken: { identifier: 'token', publicKey: '3333' } }),
    );

    // Then the program is updated and the link points to its new identifier.
    assertIsNode(result, 'rootNode');
    expect(result.additionalPrograms?.[0]).toStrictEqual(
        programNode({ ...programB, identifier: 'token', publicKey: '3333' }),
    );
    expect(result.program.accounts?.[0].data).toStrictEqual(
        definedTypeLinkNode('myType', { program: programLinkNode('token') }),
    );
});

test('it matches program identifiers exactly', () => {
    // Given a snake_case program.
    const node = rootNode(programNode({ identifier: 'my_program', publicKey: '1111' }));

    // When we update it using another casing, then nothing changes.
    expect(visit(node, updateProgramsVisitor({ myProgram: { publicKey: '2222' } }))).toStrictEqual(node);
});

test('it deletes programs', () => {
    // Given a root with two programs.
    const node = rootNode(programNode({ identifier: 'a', publicKey: '1111' }), {
        additionalPrograms: [programNode({ identifier: 'b', publicKey: '2222' })],
    });

    // When we delete the additional one, then only the main one remains.
    const result = visit(node, updateProgramsVisitor({ b: { delete: true } }));
    assertIsNode(result, 'rootNode');
    expect(result.additionalPrograms).toBeUndefined();
});

test('it throws on unrecognized update keys', () => {
    // When we use the v1 `name` key, then we expect an error when creating the visitor.
    expect(() => updateProgramsVisitor({ splToken: { name: 'token' } as never })).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS, {
            allowedKeys: ['constants', 'docs', 'events', 'identifier', 'pdas', 'plugins', 'publicKey', 'version'],
            selector: 'splToken',
            unrecognizedKeys: ['name'],
        }),
    );
});
