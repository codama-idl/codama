import { programNode, publicKeyTypeNode, structFieldTypeNode, structTypeNode, tupleTypeNode } from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import test from 'ava';

import { getValidationItemsVisitor, validationItem } from '../src/index.js';

test('it validates program nodes', t => {
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
    t.deepEqual(items, [
        validationItem('error', 'Program has no name.', node, []),
        validationItem('error', 'Program has no public key.', node, []),
        validationItem('warn', 'Program has no version.', node, []),
        validationItem('info', 'Program has no origin.', node, []),
    ]);
});

test('it validates nested nodes', t => {
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
    t.deepEqual(items, [
        validationItem('warn', 'Tuple has no items.', tupleNode, [node]),
        validationItem('error', 'Struct field name "owner" is not unique.', structNode.fields[0], [node]),
    ]);
});
