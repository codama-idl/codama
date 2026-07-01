import {
    definedTypeLinkNode,
    definedTypeNode,
    numberTypeNode,
    programNode,
    publicKeyTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
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
        // @ts-expect-error Empty string does not match Version.
        version: '',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then we expect the following validation errors.
    expect(items).toEqual([
        validationItem('error', 'Program has no name.', node, [node]),
        validationItem('error', 'Program has no public key.', node, [node]),
        validationItem('warn', 'Program has no version.', node, [node]),
        validationItem('info', 'Program has no origin.', node, [node]),
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
        validationItem('warn', 'Tuple has no items.', tupleNode, [node, tupleNode]),
        validationItem('error', 'Struct field name "owner" is not unique.', structNode.fields[0], [node, structNode]),
    ]);
});

test('it validates a defined type link nested within a struct field', () => {
    // Given a program whose defined type links to another through a struct field.
    const node = programNode({
        accounts: [],
        definedTypes: [
            definedTypeNode({
                name: 'foo',
                type: structTypeNode([structFieldTypeNode({ name: 'bar', type: definedTypeLinkNode('baz') })]),
            }),
            definedTypeNode({ name: 'baz', type: numberTypeNode('u64') }),
        ],
        errors: [],
        instructions: [],
        name: 'test',
        origin: 'anchor',
        publicKey: '11111111111111111111111111111111',
        version: '1.0.0',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then we expect no validation errors.
    expect(items).toEqual([]);
});

test('it reports a nested defined type link that points at a missing type', () => {
    // Given a program whose defined type field links to a type that does not exist.
    const link = definedTypeLinkNode('missing');
    const field = structFieldTypeNode({ name: 'bar', type: link });
    const struct = structTypeNode([field]);
    const foo = definedTypeNode({ name: 'foo', type: struct });
    const node = programNode({
        accounts: [],
        definedTypes: [foo],
        errors: [],
        instructions: [],
        name: 'test',
        origin: 'anchor',
        publicKey: '11111111111111111111111111111111',
        version: '1.0.0',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the missing link is reported as an error.
    expect(items).toEqual([
        validationItem('error', 'Pointing to a missing defined type named "missing"', link, [node, foo, struct, field, link]),
    ]);
});
