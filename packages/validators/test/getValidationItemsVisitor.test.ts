import {
    CODAMA_ERROR__CANNOT_RESOLVE_PATH,
    CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE,
    CODAMA_ERROR__INVALID_INTERPOLATED_INTENT_PLACEHOLDER,
    CODAMA_ERROR__INVALID_TICKS_PER_SECOND,
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CODAMA_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES,
    CodamaError,
    isCodamaError,
} from '@codama/errors';
import {
    accountBumpValueNode,
    accountDataValueNode,
    accountLinkNode,
    accountNode,
    accountValueNode,
    conditionalValueNode,
    constantValueNode,
    dataValueNode,
    dateTimeTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    durationTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    fieldDiscriminatorNode,
    fixedPointTypeNode,
    IdentifierString,
    injectedValueNode,
    instructionAccountNode,
    instructionDisplayNode,
    instructionNode,
    instructionStatusNode,
    integerTypeNode,
    integerValueNode,
    noneValueNode,
    optionTypeNode,
    pathString,
    payerValueNode,
    pluginNode,
    programLinkNode,
    programNode,
    ProgramNode,
    providedNode,
    publicKeyTypeNode,
    rootNode,
    someValueNode,
    stringValueNode,
    structFieldDisplayNode,
    structFieldTypeNode,
    structTypeNode,
    textNode,
    tupleTypeNode,
    valueLabelDisplayNode,
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
            context: expect.objectContaining({ __code: CODAMA_ERROR__UNEXPECTED_NODE_KIND, path: [] }),
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

test('it reports sub-instructions sharing an identifier under different parents', () => {
    // Given two parent instructions each with a sub-instruction named "shared".
    const firstShared = instructionNode({ identifier: 'shared' });
    const secondShared = instructionNode({ identifier: 'shared' });
    const firstParent = instructionNode({ identifier: 'firstParent', subInstructions: [firstShared] });
    const secondParent = instructionNode({ identifier: 'secondParent', subInstructions: [secondShared] });
    const node = programNode({
        identifier: 'test',
        instructions: [firstParent, secondParent],
        publicKey: '1111',
        version: '1.0.0',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the second sub-instruction is reported within the program.
    expect(items).toEqual([
        validationItem(
            'error',
            'Instruction identifier "shared" is not unique across the instructions and sub-instructions of program "test".',
            [node, secondParent, secondShared],
        ),
    ]);
});

test('it reports sub-instructions sharing an identifier with a top-level instruction', () => {
    // Given a top-level instruction and a sub-instruction of another instruction, both named "shared".
    const topLevelShared = instructionNode({ identifier: 'shared' });
    const nestedShared = instructionNode({ identifier: 'shared' });
    const parent = instructionNode({ identifier: 'parent', subInstructions: [nestedShared] });
    const node = programNode({
        identifier: 'test',
        instructions: [topLevelShared, parent],
        publicKey: '1111',
        version: '1.0.0',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the sub-instruction is reported within the program.
    expect(items).toEqual([
        validationItem(
            'error',
            'Instruction identifier "shared" is not unique across the instructions and sub-instructions of program "test".',
            [node, parent, nestedShared],
        ),
    ]);
});

test('it reports top-level instructions sharing an identifier with a previous sub-instruction', () => {
    // Given a sub-instruction named "shared" followed by a top-level instruction of the same name.
    const nestedShared = instructionNode({ identifier: 'shared' });
    const parent = instructionNode({ identifier: 'parent', subInstructions: [nestedShared] });
    const topLevelShared = instructionNode({ identifier: 'shared' });
    const node = programNode({
        identifier: 'test',
        instructions: [parent, topLevelShared],
        publicKey: '1111',
        version: '1.0.0',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the top-level instruction is reported, as it comes after the sub-instruction.
    expect(items).toEqual([
        validationItem(
            'error',
            'Instruction identifier "shared" is not unique across the instructions and sub-instructions of program "test".',
            [node, topLevelShared],
        ),
    ]);
});

test('it reports deeply nested sub-instructions sharing an identifier', () => {
    // Given a top-level instruction named "shared" and a grandchild instruction of the same name.
    const topLevelShared = instructionNode({ identifier: 'shared' });
    const grandchild = instructionNode({ identifier: 'shared' });
    const child = instructionNode({ identifier: 'child', subInstructions: [grandchild] });
    const parent = instructionNode({ identifier: 'parent', subInstructions: [child] });
    const node = programNode({
        identifier: 'test',
        instructions: [topLevelShared, parent],
        publicKey: '1111',
        version: '1.0.0',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the grandchild is reported with its full path.
    expect(items).toEqual([
        validationItem(
            'error',
            'Instruction identifier "shared" is not unique across the instructions and sub-instructions of program "test".',
            [node, parent, child, grandchild],
        ),
    ]);
});

test('it does not report sub-instructions with distinct identifiers', () => {
    // Given nested instructions whose identifiers are all distinct.
    const node = programNode({
        identifier: 'test',
        instructions: [
            instructionNode({
                identifier: 'parent',
                subInstructions: [
                    instructionNode({
                        identifier: 'child',
                        subInstructions: [instructionNode({ identifier: 'grandchild' })],
                    }),
                ],
            }),
            instructionNode({
                identifier: 'otherParent',
                subInstructions: [instructionNode({ identifier: 'otherChild' })],
            }),
        ],
        publicKey: '1111',
        version: '1.0.0',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then nothing is reported.
    expect(items).toEqual([]);
});

test('it does not report sub-instructions sharing an identifier across programs', () => {
    // Given a top-level instruction and a sub-instruction named "shared" in two different programs.
    const node = rootNode(
        programNode({
            identifier: 'first',
            instructions: [instructionNode({ identifier: 'shared' })],
            publicKey: '1111',
            version: '1.0.0',
        }),
        {
            additionalPrograms: [
                programNode({
                    identifier: 'second',
                    instructions: [
                        instructionNode({
                            identifier: 'parent',
                            subInstructions: [instructionNode({ identifier: 'shared' })],
                        }),
                    ],
                    publicKey: '2222',
                    version: '1.0.0',
                }),
            ],
        },
    );

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then nothing is reported, as instructions are only linked within their program.
    expect(items).toEqual([]);
});

test('it does not report sibling instructions sharing an identifier twice', () => {
    // Given duplicated top-level instructions and duplicated sub-instructions of the same parent.
    const duplicateTopLevel = instructionNode({ identifier: 'topLevel' });
    const duplicateChild = instructionNode({ identifier: 'child' });
    const parent = instructionNode({
        identifier: 'parent',
        subInstructions: [instructionNode({ identifier: 'child' }), duplicateChild],
    });
    const node = programNode({
        identifier: 'test',
        instructions: [instructionNode({ identifier: 'topLevel' }), duplicateTopLevel, parent],
        publicKey: '1111',
        version: '1.0.0',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then each duplicate is only reported by the collision check of its sibling set.
    expect(items).toEqual([
        validationItem('error', 'Instruction identifier "topLevel" is not unique in program "test".', [
            node,
            duplicateTopLevel,
        ]),
        validationItem('error', 'Sub-instruction identifier "child" is not unique in instruction "parent".', [
            node,
            parent,
            duplicateChild,
        ]),
    ]);
});

test('it reports nested duplicates that are not siblings of an earlier duplicate', () => {
    // Given duplicated top-level instructions and a sub-instruction sharing their identifier.
    const duplicateTopLevel = instructionNode({ identifier: 'shared' });
    const nestedShared = instructionNode({ identifier: 'shared' });
    const parent = instructionNode({ identifier: 'parent', subInstructions: [nestedShared] });
    const node = programNode({
        identifier: 'test',
        instructions: [instructionNode({ identifier: 'shared' }), duplicateTopLevel, parent],
        publicKey: '1111',
        version: '1.0.0',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the top-level duplicate is reported among its siblings and the sub-instruction across the program.
    expect(items).toEqual([
        validationItem('error', 'Instruction identifier "shared" is not unique in program "test".', [
            node,
            duplicateTopLevel,
        ]),
        validationItem(
            'error',
            'Instruction identifier "shared" is not unique across the instructions and sub-instructions of program "test".',
            [node, parent, nestedShared],
        ),
    ]);
});

test('it reports sub-instructions colliding with a top-level instruction once converted to camelCase', () => {
    // Given a top-level instruction "transferTokens" and a sub-instruction "transfer_tokens".
    const nestedTransfer = instructionNode({ identifier: 'transfer_tokens' });
    const parent = instructionNode({ identifier: 'parent', subInstructions: [nestedTransfer] });
    const node = programNode({
        identifier: 'test',
        instructions: [instructionNode({ identifier: 'transferTokens' }), parent],
        publicKey: '1111',
        version: '1.0.0',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the sub-instruction is reported as a casing collision within the program.
    expect(items).toEqual([
        validationItem(
            'error',
            'Instruction identifier "transfer_tokens" collides with "transferTokens" once converted to camelCase across the instructions and sub-instructions of program "test".',
            [node, parent, nestedTransfer],
        ),
    ]);
});

test('it does not report sibling instructions colliding once converted to camelCase twice', () => {
    // Given sub-instructions "transferTokens" and "transfer_tokens" of the same parent.
    const nestedTransfer = instructionNode({ identifier: 'transfer_tokens' });
    const parent = instructionNode({
        identifier: 'parent',
        subInstructions: [instructionNode({ identifier: 'transferTokens' }), nestedTransfer],
    });
    const node = programNode({
        identifier: 'test',
        instructions: [parent],
        publicKey: '1111',
        version: '1.0.0',
    });

    // When we get the validation items using a visitor.
    const items = visit(node, getValidationItemsVisitor());

    // Then the collision is only reported by the collision check of its sibling set.
    expect(items).toEqual([
        validationItem(
            'error',
            'Sub-instruction identifier "transfer_tokens" collides with "transferTokens" once converted to camelCase in instruction "parent".',
            [node, parent, nestedTransfer],
        ),
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
        { cycle: [a, b, a], formattedCycle: 'a -> b -> a', path: [node] },
    );
    expect(items).toEqual([validationItem('error', cause.message, [node], cause)]);
    expect(
        isCodamaError(
            items[0].cause,
            CODAMA_ERROR__VISITORS__CYCLIC_DEPENDENCY_DETECTED_WHEN_RESOLVING_INSTRUCTION_DEFAULT_VALUES,
        ),
    ).toBe(true);
    expect(items[0].cause?.context).toMatchObject({ formattedCycle: 'a -> b -> a', path: [node] });
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

test('it reports cyclic defined types without a finite value', () => {
    // Given a loop whose every value nests another one.
    const loop = definedTypeNode({
        identifier: 'loop',
        type: structTypeNode([structFieldTypeNode({ identifier: 'next', type: definedTypeLinkNode('loop') })]),
    });
    const program = programNode({ definedTypes: [loop], identifier: 'myProgram', publicKey: '1111', version: '1.0.0' });
    const root = rootNode(program);

    const loopCause = new CodamaError(CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE, { path: [root, program, loop] });

    // When we validate it.
    const items = visit(root, getValidationItemsVisitor());

    // Then the loop is reported.
    expect(items).toStrictEqual([validationItem('error', loopCause.message, [root, program, loop], loopCause)]);
});

test('it reports defined types aliasing themselves', () => {
    // Given a type aliasing itself.
    const alias = definedTypeNode({ identifier: 'alias', type: definedTypeLinkNode('alias') });
    const program = programNode({
        definedTypes: [alias],
        identifier: 'myProgram',
        publicKey: '1111',
        version: '1.0.0',
    });
    const root = rootNode(program);

    const aliasCause = new CodamaError(CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE, {
        path: [root, program, alias],
    });

    // When we validate it.
    const items = visit(root, getValidationItemsVisitor());

    // Then the alias is reported.
    expect(items).toStrictEqual([validationItem('error', aliasCause.message, [root, program, alias], aliasCause)]);
});

test('it accepts cyclic defined types with a finite value', () => {
    // Given a linked list that may end with `None`.
    const list = definedTypeNode({
        identifier: 'list',
        type: structTypeNode([
            structFieldTypeNode({
                identifier: 'next',
                type: optionTypeNode(definedTypeLinkNode('list'), { prefix: integerTypeNode('u8') }),
            }),
        ]),
    });
    const program = programNode({ definedTypes: [list], identifier: 'myProgram', publicKey: '1111', version: '1.0.0' });

    // When we validate it, then nothing is reported.
    expect(visit(rootNode(program), getValidationItemsVisitor())).toStrictEqual([]);
});

test('it accepts accounts whose data links back to themselves', () => {
    // Given nodes linking to their parent node, through a defined type.
    const nodeData = definedTypeNode({
        identifier: 'nodeData',
        type: structTypeNode([
            structFieldTypeNode({
                identifier: 'parent',
                type: publicKeyTypeNode({ accountLink: accountLinkNode('node') }),
            }),
        ]),
    });
    const node = accountNode({ data: definedTypeLinkNode('nodeData'), identifier: 'node' });
    const program = programNode({
        accounts: [node],
        definedTypes: [nodeData],
        identifier: 'myProgram',
        publicKey: '1111',
        version: '1.0.0',
    });

    // When we validate it, then nothing is reported, since public keys have a finite size.
    expect(visit(rootNode(program), getValidationItemsVisitor())).toStrictEqual([]);
});

test('it only reports the cyclic defined type when another one links to it', () => {
    // Given a type linking to a loop.
    const loop = definedTypeNode({
        identifier: 'loop',
        type: structTypeNode([structFieldTypeNode({ identifier: 'next', type: definedTypeLinkNode('loop') })]),
    });
    const usesLoop = definedTypeNode({ identifier: 'usesLoop', type: definedTypeLinkNode('loop') });
    const program = programNode({
        definedTypes: [loop, usesLoop],
        identifier: 'myProgram',
        publicKey: '1111',
        version: '1.0.0',
    });
    const root = rootNode(program);

    const loopCause = new CodamaError(CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE, { path: [root, program, loop] });

    // When we validate it.
    const items = visit(root, getValidationItemsVisitor());

    // Then only the loop is reported.
    expect(items).toStrictEqual([validationItem('error', loopCause.message, [root, program, loop], loopCause)]);
});

test('it reports every defined type of a cycle without a finite value', () => {
    // Given two types nesting each other.
    const a = definedTypeNode({
        identifier: 'a',
        type: structTypeNode([structFieldTypeNode({ identifier: 'b', type: definedTypeLinkNode('b') })]),
    });
    const b = definedTypeNode({
        identifier: 'b',
        type: structTypeNode([structFieldTypeNode({ identifier: 'a', type: definedTypeLinkNode('a') })]),
    });
    const program = programNode({ definedTypes: [a, b], identifier: 'myProgram', publicKey: '1111', version: '1.0.0' });
    const root = rootNode(program);

    const aCause = new CodamaError(CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE, { path: [root, program, a] });

    const bCause = new CodamaError(CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE, { path: [root, program, b] });

    // When we validate them.
    const items = visit(root, getValidationItemsVisitor());

    // Then both are reported.
    expect(items).toStrictEqual([
        validationItem('error', aCause.message, [root, program, a], aCause),
        validationItem('error', bCause.message, [root, program, b], bCause),
    ]);
});

test('it does not mistake links to same-named defined types of other programs for cycles', () => {
    // Given a type of program A linking to a same-named type of program B.
    const typeA = definedTypeNode({
        identifier: 'config',
        type: definedTypeLinkNode('config', { program: programLinkNode('programB') }),
    });
    const typeB = definedTypeNode({ identifier: 'config', type: integerTypeNode('u32') });
    const programA = programNode({
        definedTypes: [typeA],
        identifier: 'programA',
        publicKey: '1111',
        version: '1.0.0',
    });
    const programB = programNode({
        definedTypes: [typeB],
        identifier: 'programB',
        publicKey: '2222',
        version: '1.0.0',
    });

    // When we validate them, then nothing is reported.
    expect(visit(rootNode(programA, { additionalPrograms: [programB] }), getValidationItemsVisitor())).toStrictEqual(
        [],
    );
});

test('it does not check the values of defined types outside a program', () => {
    // Given a loop validated on its own.
    const link = definedTypeLinkNode('loop');
    const field = structFieldTypeNode({ identifier: 'next', type: link });
    const struct = structTypeNode([field]);
    const loop = definedTypeNode({ identifier: 'loop', type: struct });

    // When we validate it.
    const items = visit(loop, getValidationItemsVisitor());

    // Then it does not throw, and only reports the link it cannot resolve without a program.
    expect(items).toStrictEqual([
        validationItem('error', 'Pointing to a missing defined type named "loop"', [loop, struct, field, link]),
    ]);
});

test('it reports date-times whose ticks per second are not positive integers', () => {
    const node = dateTimeTypeNode(integerTypeNode('i64'), { ticksPerSecond: 0 });
    const items = visit(node, getValidationItemsVisitor());
    const cause = new CodamaError(CODAMA_ERROR__INVALID_TICKS_PER_SECOND, { path: [node], ticksPerSecond: 0 });
    expect(items).toStrictEqual([validationItem('error', cause.message, [node], cause)]);
});

test('it reports durations whose ticks per second are not positive integers', () => {
    const node = durationTypeNode(integerTypeNode('u64'), { ticksPerSecond: 1.5 });
    const items = visit(node, getValidationItemsVisitor());
    const cause = new CodamaError(CODAMA_ERROR__INVALID_TICKS_PER_SECOND, { path: [node], ticksPerSecond: 1.5 });
    expect(items).toStrictEqual([validationItem('error', cause.message, [node], cause)]);
});

test('it accepts date-times and durations with positive integer ticks per second', () => {
    expect(
        visit(dateTimeTypeNode(integerTypeNode('i64'), { ticksPerSecond: 1000 }), getValidationItemsVisitor()),
    ).toEqual([]);
    expect(visit(durationTypeNode(integerTypeNode('u64')), getValidationItemsVisitor())).toEqual([]);
});

test('it reports fixed points whose scale is not a positive integer', () => {
    const node = fixedPointTypeNode(integerTypeNode('u64'), { scale: 0 });
    expect(visit(node, getValidationItemsVisitor())).toEqual([
        validationItem('error', 'Fixed-point scale must be a positive integer, got 0.', [node]),
    ]);
});

test('it accepts fixed points with a positive integer scale', () => {
    expect(visit(fixedPointTypeNode(integerTypeNode('u64'), { scale: 6 }), getValidationItemsVisitor())).toEqual([]);
});

test('it accepts value labels matching the type of their field', () => {
    const display = structFieldDisplayNode({
        valueLabels: [
            valueLabelDisplayNode({ label: 'Never expires', value: noneValueNode() }),
            valueLabelDisplayNode({ label: 'Now', value: someValueNode(integerValueNode('0')) }),
        ],
    });
    const node = structFieldTypeNode({ display, identifier: 'expiry', type: optionTypeNode(integerTypeNode('i64')) });
    expect(visit(node, getValidationItemsVisitor())).toEqual([]);
});

test('it reports value labels not matching the type of their field', () => {
    const valueLabel = valueLabelDisplayNode({ label: 'All', value: stringValueNode('max') });
    const display = structFieldDisplayNode({ valueLabels: [valueLabel] });
    const node = structFieldTypeNode({ display, identifier: 'amount', type: integerTypeNode('u64') });
    expect(visit(node, getValidationItemsVisitor())).toEqual([
        validationItem('error', 'Value label does not match the type of field "amount".', [node, display, valueLabel]),
    ]);
});

test('it reports value labels with injected values', () => {
    // Given a value label injecting its value, within an instruction that does not provide it.
    const valueLabel = valueLabelDisplayNode({ label: 'All', value: injectedValueNode({ key: 'max' }) });
    const display = structFieldDisplayNode({ valueLabels: [valueLabel] });
    const field = structFieldTypeNode({ display, identifier: 'amount', type: integerTypeNode('u64') });
    const data = structTypeNode([field]);
    const node = instructionNode({ data, identifier: 'withdraw' });

    // Then only the value label is reported, not the missing provider.
    expect(visit(node, getValidationItemsVisitor())).toEqual([
        validationItem('error', 'Value labels must be concrete values, got an injected value.', [
            node,
            data,
            field,
            display,
            valueLabel,
        ]),
    ]);
});

test('it reports value labels with constant values', () => {
    const value = constantValueNode(integerTypeNode('u64'), integerValueNode('1'));
    const valueLabel = valueLabelDisplayNode({ label: 'One', value });
    const display = structFieldDisplayNode({ valueLabels: [valueLabel] });
    const node = structFieldTypeNode({ display, identifier: 'amount', type: integerTypeNode('u64') });
    expect(visit(node, getValidationItemsVisitor())).toEqual([
        validationItem('error', 'Value labels must be concrete values, got a constant value.', [
            node,
            display,
            valueLabel,
        ]),
    ]);
});

test('it checks value labels against the defined types their field links to', () => {
    // Given a field linking to an optional amount, labelled with an integer.
    const valueLabel = valueLabelDisplayNode({ label: 'All', value: integerValueNode('1') });
    const display = structFieldDisplayNode({ valueLabels: [valueLabel] });
    const field = structFieldTypeNode({ display, identifier: 'amount', type: definedTypeLinkNode('maybeAmount') });
    const data = structTypeNode([field]);
    const account = accountNode({ data, identifier: 'vault' });
    const program = programNode({
        accounts: [account],
        definedTypes: [definedTypeNode({ identifier: 'maybeAmount', type: optionTypeNode(integerTypeNode('u64')) })],
        identifier: 'myProgram',
        publicKey: '1111',
        version: '1.0.0',
    });
    const root = rootNode(program);

    // Then the integer does not match the option.
    expect(visit(root, getValidationItemsVisitor())).toEqual([
        validationItem('error', 'Value label does not match the type of field "amount".', [
            root,
            program,
            account,
            data,
            field,
            display,
            valueLabel,
        ]),
    ]);
});

test('it accepts field discriminators pointing to struct fields', () => {
    const data = structTypeNode([
        structFieldTypeNode({ defaultValue: integerValueNode('1'), identifier: 'kind', type: integerTypeNode('u8') }),
    ]);
    const node = accountNode({ data, discriminators: [fieldDiscriminatorNode('kind')], identifier: 'vault' });
    expect(visit(node, getValidationItemsVisitor())).toEqual([]);
});

test('it reports field discriminators whose path cannot be resolved', () => {
    const data = structTypeNode([structFieldTypeNode({ identifier: 'kind', type: integerTypeNode('u8') })]);
    const discriminator = fieldDiscriminatorNode('missing');
    const node = accountNode({ data, discriminators: [discriminator], identifier: 'vault' });
    const items = visit(node, getValidationItemsVisitor());
    const cause = new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
        path: [node, data],
        pathString: pathString('missing'),
        segment: 'missing',
    });
    expect(items).toStrictEqual([validationItem('error', cause.message, [node, discriminator], cause)]);
});

test('it reports field discriminators that do not point to struct fields', () => {
    const data = tupleTypeNode([integerTypeNode('u8')]);
    const discriminator = fieldDiscriminatorNode('[0]');
    const node = accountNode({ data, discriminators: [discriminator], identifier: 'vault' });
    expect(visit(node, getValidationItemsVisitor())).toEqual([
        validationItem('error', 'Field discriminator path "[0]" must point to a struct field.', [node, discriminator]),
    ]);
});

test('it reports field discriminators of instructions without data', () => {
    const discriminator = fieldDiscriminatorNode('kind');
    const node = instructionNode({ discriminators: [discriminator], identifier: 'close' });
    expect(visit(node, getValidationItemsVisitor())).toEqual([
        validationItem('error', 'Field discriminator path "kind" cannot be resolved as there is no data.', [
            node,
            discriminator,
        ]),
    ]);
});

test('it reports field discriminators crossing account links', () => {
    // Given a token account identified by the decimals of its mint, read through an account link.
    const mint = accountNode({
        data: structTypeNode([structFieldTypeNode({ identifier: 'decimals', type: integerTypeNode('u8') })]),
        identifier: 'mint',
    });
    const mintField = structFieldTypeNode({
        identifier: 'mint',
        type: publicKeyTypeNode({ accountLink: accountLinkNode('mint') }),
    });
    const data = structTypeNode([mintField]);
    const discriminator = fieldDiscriminatorNode('mint.data.decimals');
    const token = accountNode({ data, discriminators: [discriminator], identifier: 'token' });
    const program = programNode({
        accounts: [token, mint],
        identifier: 'myProgram',
        publicKey: '1111',
        version: '1.0.0',
    });
    const root = rootNode(program);

    // Then the discriminator is reported, since identification only reads the bytes being identified.
    const items = visit(root, getValidationItemsVisitor());
    expect(items).toEqual([
        validationItem(
            'error',
            'Field discriminator path "mint.data.decimals" must not cross an account link.',
            [root, program, token, discriminator],
            new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
                path: [root, program, token, data, mintField, mintField.type],
                pathString: pathString('mint.data.decimals'),
                segment: 'data',
            }),
        ),
    ]);
});

test('it reports field discriminator paths applying other segments to linked public keys as unresolvable', () => {
    // Given a discriminator reading a field of a linked mint without a data segment.
    const mint = accountNode({
        data: structTypeNode([structFieldTypeNode({ identifier: 'decimals', type: integerTypeNode('u8') })]),
        identifier: 'mint',
    });
    const mintField = structFieldTypeNode({
        identifier: 'mint',
        type: publicKeyTypeNode({ accountLink: accountLinkNode('mint') }),
    });
    const data = structTypeNode([mintField]);
    const discriminator = fieldDiscriminatorNode('mint.decimals');
    const token = accountNode({ data, discriminators: [discriminator], identifier: 'token' });
    const program = programNode({
        accounts: [token, mint],
        identifier: 'myProgram',
        publicKey: '1111',
        version: '1.0.0',
    });
    const root = rootNode(program);

    // Then the path is reported as unresolvable, as it does not cross the link.
    const cause = new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
        path: [root, program, token, data, mintField, mintField.type],
        pathString: pathString('mint.decimals'),
        segment: 'decimals',
    });
    expect(visit(root, getValidationItemsVisitor())).toEqual([
        validationItem('error', cause.message, [root, program, token, discriminator], cause),
    ]);
});

test('it reports account links pointing to missing accounts', () => {
    const link = accountLinkNode('missing');
    const node = instructionAccountNode({ accountLink: link, identifier: 'mint', isSigner: false, isWritable: false });
    const program = programNode({
        identifier: 'myProgram',
        instructions: [instructionNode({ accounts: [node], identifier: 'mintTo' })],
        publicKey: '1111',
        version: '1.0.0',
    });
    const root = rootNode(program);
    expect(visit(root, getValidationItemsVisitor())).toEqual([
        validationItem('error', 'Pointing to a missing account named "missing"', [
            root,
            program,
            program.instructions![0],
            node,
            link,
        ]),
    ]);
});

test('it accepts data values whose path resolves within the instruction data', () => {
    const data = structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })]);
    const node = instructionNode({
        data,
        identifier: 'transfer',
        provides: [providedNode('x', dataValueNode('amount'))],
    });
    expect(visit(node, getValidationItemsVisitor())).toEqual([]);
});

test('it reports data values whose path cannot be resolved', () => {
    const data = structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })]);
    const value = dataValueNode('fee');
    const provided = providedNode('x', value);
    const node = instructionNode({ data, identifier: 'transfer', provides: [provided] });
    const cause = new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
        path: [node, data],
        pathString: pathString('fee'),
        segment: 'fee',
    });
    expect(visit(node, getValidationItemsVisitor())).toStrictEqual([
        validationItem('error', cause.message, [node, provided, value], cause),
    ]);
});

test('it reports data value defaults whose path cannot be resolved once', () => {
    // Given an account defaulting to a value conditioned on a missing data path.
    const value = dataValueNode('missing');
    const defaultValue = conditionalValueNode({ condition: value, ifTrue: payerValueNode() });
    const account = instructionAccountNode({ defaultValue, identifier: 'payer', isSigner: true, isWritable: true });
    const data = structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })]);
    const node = instructionNode({ accounts: [account], data, identifier: 'transfer' });

    // Then only the path is reported, not the invalid dependency it also is.
    const cause = new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
        path: [node, data],
        pathString: pathString('missing'),
        segment: 'missing',
    });
    expect(visit(node, getValidationItemsVisitor())).toStrictEqual([
        validationItem('error', cause.message, [node, account, defaultValue, value], cause),
    ]);
});

test('it reports account data value defaults of unknown accounts once', () => {
    // Given an account defaulting to the data of an unknown account.
    const value = accountDataValueNode('mint', { path: 'owner' });
    const account = instructionAccountNode({
        defaultValue: value,
        identifier: 'owner',
        isSigner: false,
        isWritable: false,
    });
    const node = instructionNode({ accounts: [account], identifier: 'transfer' });

    // Then only the account data value is reported, not the invalid dependency it also is.
    expect(visit(node, getValidationItemsVisitor())).toEqual([
        validationItem('error', 'Account "mint" is not an account of instruction "transfer".', [node, account, value]),
    ]);
});

test('it reports account values of unknown accounts', () => {
    const value = accountValueNode('missing');
    const provided = providedNode('owner', value);
    const node = instructionNode({ identifier: 'transfer', provides: [provided] });
    expect(visit(node, getValidationItemsVisitor())).toEqual([
        validationItem('error', 'Account "missing" is not an account of instruction "transfer".', [
            node,
            provided,
            value,
        ]),
    ]);
});

test('it reports account bump values of unknown accounts once', () => {
    // Given an account defaulting to the bump of an unknown account.
    const value = accountBumpValueNode('missing');
    const account = instructionAccountNode({
        defaultValue: value,
        identifier: 'seed',
        isSigner: false,
        isWritable: false,
    });
    const node = instructionNode({ accounts: [account], identifier: 'create' });

    // Then the bump value is reported, rather than the invalid dependency it also is.
    expect(visit(node, getValidationItemsVisitor())).toEqual([
        validationItem('error', 'Account "missing" is not an account of instruction "create".', [node, account, value]),
    ]);
});

test('it reports data values of instructions without data', () => {
    const value = dataValueNode('amount');
    const provided = providedNode('x', value);
    const node = instructionNode({ identifier: 'close', provides: [provided] });
    expect(visit(node, getValidationItemsVisitor())).toEqual([
        validationItem('error', 'Data path "amount" cannot be resolved as instruction "close" has no data.', [
            node,
            provided,
            value,
        ]),
    ]);
});

test('it accepts data values crossing account links', () => {
    // Given instruction data holding a mint address linked to the mint account.
    const mint = accountNode({
        data: structTypeNode([structFieldTypeNode({ identifier: 'decimals', type: integerTypeNode('u8') })]),
        identifier: 'mint',
    });
    const data = structTypeNode([
        structFieldTypeNode({ identifier: 'mint', type: publicKeyTypeNode({ accountLink: accountLinkNode('mint') }) }),
    ]);
    const instruction = instructionNode({
        data,
        identifier: 'transfer',
        provides: [providedNode('decimals', dataValueNode('mint.data.decimals'))],
    });
    const program = programNode({
        accounts: [mint],
        identifier: 'myProgram',
        instructions: [instruction],
        publicKey: '1111',
        version: '1.0.0',
    });

    // Then the path is resolved through the link.
    expect(visit(rootNode(program), getValidationItemsVisitor())).toEqual([]);
});

test('it accepts account data values whose path resolves within the linked account data', () => {
    const mint = accountNode({
        data: structTypeNode([structFieldTypeNode({ identifier: 'decimals', type: integerTypeNode('u8') })]),
        identifier: 'mint',
    });
    const instruction = instructionNode({
        accounts: [
            instructionAccountNode({
                accountLink: accountLinkNode('mint'),
                identifier: 'mint',
                isSigner: false,
                isWritable: false,
            }),
        ],
        identifier: 'transfer',
        provides: [
            providedNode('decimals', accountDataValueNode('mint', { path: 'decimals' })),
            providedNode('state', accountDataValueNode('mint')),
        ],
    });
    const program = programNode({
        accounts: [mint],
        identifier: 'myProgram',
        instructions: [instruction],
        publicKey: '1111',
        version: '1.0.0',
    });
    expect(visit(rootNode(program), getValidationItemsVisitor())).toEqual([]);
});

test('it reports account data values whose path cannot be resolved', () => {
    const mintData = structTypeNode([structFieldTypeNode({ identifier: 'decimals', type: integerTypeNode('u8') })]);
    const mint = accountNode({ data: mintData, identifier: 'mint' });
    const value = accountDataValueNode('mint', { path: 'supply' });
    const provided = providedNode('supply', value);
    const instruction = instructionNode({
        accounts: [
            instructionAccountNode({
                accountLink: accountLinkNode('mint'),
                identifier: 'mint',
                isSigner: false,
                isWritable: false,
            }),
        ],
        identifier: 'transfer',
        provides: [provided],
    });
    const program = programNode({
        accounts: [mint],
        identifier: 'myProgram',
        instructions: [instruction],
        publicKey: '1111',
        version: '1.0.0',
    });
    const root = rootNode(program);
    const cause = new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
        path: [root, program, mint, mintData],
        pathString: pathString('supply'),
        segment: 'supply',
    });
    expect(visit(root, getValidationItemsVisitor())).toStrictEqual([
        validationItem('error', cause.message, [root, program, instruction, provided, value], cause),
    ]);
});

test('it reports account data values of unknown accounts', () => {
    const value = accountDataValueNode('mint', { path: 'decimals' });
    const provided = providedNode('decimals', value);
    const node = instructionNode({ identifier: 'transfer', provides: [provided] });
    expect(visit(node, getValidationItemsVisitor())).toEqual([
        validationItem('error', 'Account "mint" is not an account of instruction "transfer".', [node, provided, value]),
    ]);
});

test('it reports account data values of accounts without an account link', () => {
    const value = accountDataValueNode('mint', { path: 'decimals' });
    const provided = providedNode('decimals', value);
    const node = instructionNode({
        accounts: [instructionAccountNode({ identifier: 'mint', isSigner: false, isWritable: false })],
        identifier: 'transfer',
        provides: [provided],
    });
    expect(visit(node, getValidationItemsVisitor())).toEqual([
        validationItem('error', 'Account "mint" has no account link, so its data cannot be read.', [
            node,
            provided,
            value,
        ]),
    ]);
});

test('it accepts interpolated intents whose placeholders resolve', () => {
    const mint = accountNode({
        data: structTypeNode([structFieldTypeNode({ identifier: 'decimals', type: integerTypeNode('u8') })]),
        identifier: 'mint',
    });
    const instruction = instructionNode({
        accounts: [
            instructionAccountNode({
                accountLink: accountLinkNode('mint'),
                identifier: 'mint',
                isSigner: false,
                isWritable: false,
            }),
        ],
        data: structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })]),
        display: instructionDisplayNode({
            interpolatedIntent: 'Mint ${data.amount} of ${accounts.mint} (${accounts.mint.data.decimals} decimals)',
        }),
        identifier: 'mintTo',
    });
    const program = programNode({
        accounts: [mint],
        identifier: 'myProgram',
        instructions: [instruction],
        publicKey: '1111',
        version: '1.0.0',
    });
    expect(visit(rootNode(program), getValidationItemsVisitor())).toEqual([]);
});

test('it reports interpolated intents with invalid placeholders', () => {
    const display = instructionDisplayNode({ interpolatedIntent: 'Burn ${accounts.mint.lamports}' });
    const node = instructionNode({ display, identifier: 'burn' });
    const cause = new CodamaError(CODAMA_ERROR__INVALID_INTERPOLATED_INTENT_PLACEHOLDER, {
        placeholder: '${accounts.mint.lamports}',
        template: 'Burn ${accounts.mint.lamports}',
    });
    expect(visit(node, getValidationItemsVisitor())).toStrictEqual([
        validationItem('error', cause.message, [node, display], cause),
    ]);
});

test('it reports interpolated intents referring to unknown accounts', () => {
    const display = instructionDisplayNode({ interpolatedIntent: textNode({ content: 'Close ${accounts.vault}' }) });
    const node = instructionNode({ display, identifier: 'close' });
    const items = visit(node, getValidationItemsVisitor());
    expect(items).toContainEqual(
        validationItem('error', 'Account "vault" is not an account of instruction "close".', [node, display]),
    );
});

test('it reports interpolated intents whose data paths cannot be resolved', () => {
    const data = structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })]);
    const display = instructionDisplayNode({ interpolatedIntent: 'Transfer ${data.fee}' });
    const node = instructionNode({ data, display, identifier: 'transfer' });
    const cause = new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
        path: [node, data],
        pathString: pathString('fee'),
        segment: 'fee',
    });
    expect(visit(node, getValidationItemsVisitor())).toStrictEqual([
        validationItem('error', cause.message, [node, display], cause),
    ]);
});
