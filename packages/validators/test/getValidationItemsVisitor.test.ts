import {
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CODAMA_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES,
    CodamaError,
    isCodamaError,
} from '@codama/errors';
import {
    accountBumpValueNode,
    accountNode,
    accountValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    IdentifierString,
    injectedValueNode,
    instructionAccountNode,
    instructionNode,
    instructionStatusNode,
    integerTypeNode,
    integerValueNode,
    pluginNode,
    programNode,
    ProgramNode,
    providedNode,
    publicKeyTypeNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
    textNode,
    tupleTypeNode,
} from '@codama/nodes';
import { NodeStack, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getValidationItemsVisitor, validationItem } from '../src';

test('it reports no cause for diagnostics that do not stem from errors', () => {
    const node = tupleTypeNode([]);
    const [item] = visit(node, getValidationItemsVisitor());
    expect(item).toStrictEqual({ level: 'warn', message: 'Tuple has no items.', path: [node] });
});

test('it reports instruction accounts without identifiers against the account', () => {
    // Given an instruction with an account whose identifier is empty.
    const account = {
        ...instructionAccountNode({ identifier: 'owner', isSigner: false, isWritable: false }),
        identifier: '' as IdentifierString,
    };
    const node = { ...instructionNode({ identifier: 'transfer' }), accounts: [account] };

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the item leads to the account rather than to the instruction.
    expect(items).toContainEqual(validationItem('error', 'Instruction account has no identifier.', [node, account]));
});

test('it accepts node stacks from other copies of the package', () => {
    // Given a stack that is not an instance of this copy's NodeStack class.
    const node = tupleTypeNode([]);
    const foreignStack = { getPath: () => [node] } as unknown as NodeStack;

    // Then its path is used.
    expect(validationItem('warn', 'Tuple has no items.', foreignStack)).toStrictEqual(
        validationItem('warn', 'Tuple has no items.', [node]),
    );
});

test('it refuses to create validation items that are not about a node', () => {
    expect(() => validationItem('error', 'Oops.', new NodeStack())).toThrow(
        expect.objectContaining({
            context: expect.objectContaining({ __code: CODAMA_ERROR__UNEXPECTED_NODE_KIND, kind: null, node: null }),
        }),
    );
});

test('it validates program nodes', () => {
    // Given a program node with empty strings (as a parsed, unvalidated IDL may contain).
    const node = {
        ...programNode({ identifier: 'test', publicKey: '1111' }),
        identifier: '' as IdentifierString,
        publicKey: '',
        version: '',
    } as unknown as ProgramNode;

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then we expect the following validation errors.
    expect(items).toEqual([
        validationItem('error', 'Program has no identifier.', [node]),
        validationItem('error', 'Program has no public key.', [node]),
        validationItem('warn', 'Program has no version.', [node]),
    ]);
});

test('it validates nested nodes', () => {
    // Given the following tuple with nested issues.
    const tupleNode = tupleTypeNode([]);
    const duplicateOwnerField = structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() });
    const structNode = structTypeNode([
        structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() }),
        duplicateOwnerField,
    ]);
    const node = tupleTypeNode([tupleNode, structNode]);

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then we expect the following validation errors.
    expect(items).toEqual([
        validationItem('warn', 'Tuple has no items.', [node, tupleNode]),
        validationItem('error', 'Struct field identifier "owner" is not unique.', [
            node,
            structNode,
            duplicateOwnerField,
        ]),
    ]);
});

test('it validates a defined type link nested within a struct field', () => {
    // Given a program whose defined type links to another through a struct field.
    const node = programNode({
        definedTypes: [
            definedTypeNode({
                identifier: 'foo',
                type: structTypeNode([structFieldTypeNode({ identifier: 'bar', type: definedTypeLinkNode('baz') })]),
            }),
            definedTypeNode({ identifier: 'baz', type: integerTypeNode('u64') }),
        ],
        identifier: 'test',
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
    const field = structFieldTypeNode({ identifier: 'bar', type: link });
    const struct = structTypeNode([field]);
    const foo = definedTypeNode({ identifier: 'foo', type: struct });
    const node = programNode({
        definedTypes: [foo],
        identifier: 'test',
        publicKey: '11111111111111111111111111111111',
        version: '1.0.0',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the missing link is reported as an error.
    expect(items).toEqual([
        validationItem('error', 'Pointing to a missing defined type named "missing"', [node, foo, struct, field, link]),
    ]);
});

test.each([
    ['fooBar', 'foo_bar'],
    ['foo1', 'foo_1'],
    ['getURL', 'get_url'],
    ['HTTPServer', 'httpServer'],
    ['MAX_SUPPLY', 'maxSupply'],
    ['_foo', 'foo'],
    ['foo__bar', 'foo_bar'],
    ['foo1Bar', 'foo1_bar'],
])('it reports "%s" and "%s" as colliding once converted to camelCase', (first, second) => {
    // Given a struct whose two fields share a camelCase form.
    const collidingField = structFieldTypeNode({ identifier: second, type: publicKeyTypeNode() });
    const node = structTypeNode([
        structFieldTypeNode({ identifier: first, type: publicKeyTypeNode() }),
        collidingField,
    ]);

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the second field is reported as colliding with the first.
    expect(items).toEqual([
        validationItem(
            'error',
            `Struct field identifier "${second}" collides with "${first}" once converted to camelCase.`,
            [node, collidingField],
        ),
    ]);
});

test.each([
    ['foo_dart', 'food_art'],
    ['group__sub_group__name', 'group_subgroup_name'],
    ['foo1bar', 'foo1_bar'],
    ['HTTPServer', 'hTTPServer'],
])('it allows "%s" and "%s" to coexist', (first, second) => {
    // Given a struct whose two fields have distinct camelCase forms.
    const node = structTypeNode([
        structFieldTypeNode({ identifier: first, type: publicKeyTypeNode() }),
        structFieldTypeNode({ identifier: second, type: publicKeyTypeNode() }),
    ]);

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then no collision is reported.
    expect(items).toEqual([]);
});

test('it reports identifier collisions within the collections of a program', () => {
    // Given a program with accounts colliding in casing.
    const collidingAccount = accountNode({ identifier: 'Token' });
    const node = programNode({
        accounts: [accountNode({ identifier: 'token' }), collidingAccount],
        identifier: 'test',
        publicKey: '1111',
        version: '1.0.0',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the collision is reported within the program.
    expect(items).toEqual([
        validationItem(
            'error',
            'Account identifier "Token" collides with "token" once converted to camelCase in program "test".',
            [node, collidingAccount],
        ),
    ]);
});

test('it reports identifier collisions between the programs of a root', () => {
    // Given a root whose programs collide in casing.
    const additionalProgram = programNode({ identifier: 'splToken', publicKey: '2222', version: '1.0.0' });
    const node = rootNode(programNode({ identifier: 'spl_token', publicKey: '1111', version: '1.0.0' }), {
        additionalPrograms: [additionalProgram],
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the collision is reported.
    expect(items).toEqual([
        validationItem(
            'error',
            'Program identifier "splToken" collides with "spl_token" once converted to camelCase.',
            [node, additionalProgram],
        ),
    ]);
});

test('it reports duplicate enum variants', () => {
    // Given an enum with two identical variants.
    const duplicateVariant = enumVariantTypeNode('quit');
    const node = enumTypeNode([enumVariantTypeNode('quit'), duplicateVariant]);

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the duplicate is reported once.
    expect(items).toEqual([
        validationItem('error', 'Enum variant identifier "quit" is not unique.', [node, duplicateVariant]),
    ]);
});

test('it reports duplicate instruction accounts', () => {
    // Given an instruction with two identical accounts.
    const duplicateAccount = instructionAccountNode({ identifier: 'owner', isSigner: true, isWritable: false });
    const node = instructionNode({
        accounts: [
            instructionAccountNode({ identifier: 'owner', isSigner: true, isWritable: false }),
            duplicateAccount,
        ],
        identifier: 'transfer',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the duplicate is reported within the instruction.
    expect(items).toEqual([
        validationItem('error', 'Instruction account identifier "owner" is not unique in instruction "transfer".', [
            node,
            duplicateAccount,
        ]),
    ]);
});

test('it reports errors raised when resolving instruction default values', () => {
    // Given an instruction whose account defaults depend on each other.
    const node = instructionNode({
        accounts: [
            instructionAccountNode({
                defaultValue: accountValueNode('b'),
                identifier: 'a',
                isSigner: false,
                isWritable: false,
            }),
            instructionAccountNode({
                defaultValue: accountValueNode('a'),
                identifier: 'b',
                isSigner: false,
                isWritable: false,
            }),
        ],
        identifier: 'myInstruction',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the cycle is reported against the instruction, with the error it stems from as its cause.
    const [a, b] = node.accounts!;
    const cause = new CodamaError(
        CODAMA_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES,
        { cycle: [a, b, a], formattedCycle: 'a -> b -> a', instruction: node, instructionName: node.identifier },
    );
    expect(items).toEqual([validationItem('error', cause.message, [node], cause)]);
    expect(
        isCodamaError(
            items[0].cause,
            CODAMA_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES,
        ),
    ).toBe(true);
    expect(items[0].cause?.context).toMatchObject({ formattedCycle: 'a -> b -> a', instructionName: 'myInstruction' });
});

test('it reports a data field defaulting to the bump of a potential signer', () => {
    // Given an instruction whose data field injects the bump of a signer account.
    const node = instructionNode({
        accounts: [instructionAccountNode({ identifier: 'authority', isSigner: 'either', isWritable: false })],
        data: structTypeNode([
            structFieldTypeNode({
                defaultValue: injectedValueNode({ key: 'authorityBump' }),
                identifier: 'bump',
                type: integerTypeNode('u8'),
            }),
        ]),
        identifier: 'myInstruction',
        provides: [providedNode('authorityBump', accountBumpValueNode('authority'))],
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the bump default is reported.
    expect(items).toEqual([
        validationItem(
            'error',
            'Data field "bump" cannot default to the bump of the "authority" account as it may be a signer.',
            [node],
        ),
    ]);
});

test('it reports injected values that are neither provided nor given a fallback', () => {
    // Given an instruction with an unprovided injection, an injection with a
    // fallback, and a sub-instruction consuming a key its parent provides.
    const unprovided = injectedValueNode({ key: 'missing' });
    const unprovidedField = structFieldTypeNode({
        defaultValue: unprovided,
        identifier: 'a',
        type: integerTypeNode('u8'),
    });
    const data = structTypeNode([
        unprovidedField,
        structFieldTypeNode({
            defaultValue: injectedValueNode({ fallback: integerValueNode('1'), key: 'alsoMissing' }),
            identifier: 'b',
            type: integerTypeNode('u8'),
        }),
    ]);
    const node = instructionNode({
        data,
        identifier: 'parent',
        provides: [providedNode('decimals', integerValueNode('6'))],
        subInstructions: [
            instructionNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        defaultValue: injectedValueNode({ key: 'decimals' }),
                        identifier: 'decimals',
                        type: integerTypeNode('u8'),
                    }),
                ]),
                identifier: 'child',
            }),
        ],
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then only the unprovided injection without a fallback is reported.
    expect(items).toEqual([
        validationItem('error', 'Injected value "missing" is not provided and has no fallback.', [
            node,
            data,
            unprovidedField,
            unprovided,
        ]),
    ]);
});

test('it reports text nodes without plugins', () => {
    // Given instruction statuses whose messages are text nodes, with and without plugins.
    const plainText = textNode({ content: 'Use the new instruction.' });
    const plainStatus = instructionStatusNode('deprecated', { message: plainText });
    const translatedStatus = instructionStatusNode('deprecated', {
        message: textNode({ content: 'Use the new instruction.', plugins: [pluginNode('i18n.es', 'Usa la nueva.')] }),
    });

    // When we get their validation items.
    const plainItems = visit(plainStatus, getValidationItemsVisitor());
    const translatedItems = visit(translatedStatus, getValidationItemsVisitor());

    // Then only the plugin-free text node is reported, as information.
    expect(plainItems).toEqual([
        validationItem('info', 'Text node has no plugins; use a plain string instead.', [plainStatus, plainText]),
    ]);
    expect(translatedItems).toEqual([]);
});
