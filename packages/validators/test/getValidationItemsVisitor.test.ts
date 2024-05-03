import { programNode, publicKeyTypeNode, structFieldTypeNode, structTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { expect, test } from 'vitest';

import { getValidationItemsVisitor, validationItem } from '../src';

test('it validates program nodes', () => {
    // Given the following program node with empty strings.
    const node = programNode({
        accounts: [],
        definedTypes: [],
        errors: [],
        instructions: [],
        name: '',
        origin: undefined,
        publicKey: '',
        // @ts-expect-error Empty string does not match ProgramVersion.
        version: '',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then we expect the following validation errors.
    expect(items).toEqual([
        validationItem('error', 'Program has no name.', node, []),
        validationItem('error', 'Program has no public key.', node, []),
        validationItem('warn', 'Program has no version.', node, []),
        validationItem('info', 'Program has no origin.', node, []),
    ]);
});

test('it validates nested nodes', () => {
    // Given the following tuple with nested issues.
    const node = tupleTypeNode([
        tupleTypeNode([]),
        structTypeNode([
            structFieldTypeNode({ name: 'owner', type: publicKeyTypeNode() }),
            structFieldTypeNode({ name: 'owner', type: publicKeyTypeNode() }),
        ]),
    ]);

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then we expect the following validation errors.
    const tupleNode = node.items[0];
    const structNode = node.items[1];
    expect(items).toEqual([
        validationItem('warn', 'Tuple has no items.', tupleNode, [node]),
        validationItem('error', 'Struct field name "owner" is not unique.', structNode.fields[0], [node]),
    ]);
});
