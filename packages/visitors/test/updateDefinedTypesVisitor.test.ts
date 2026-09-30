import { CODAMA_ERROR__VISITORS__DEFINED_TYPE_MEMBER_NOT_FOUND, CodamaError } from '@codama/errors';
import {
    accountNode,
    assertIsNode,
    dataValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumValueNode,
    enumVariantTypeNode,
    fixedSizeTransformNode,
    identifierString,
    instructionAccountNode,
    instructionNode,
    integerTypeNode,
    programLinkNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { updateDefinedTypesVisitor } from '../src';

test('it renames defined types and the links pointing to them', () => {
    // Given a defined type used by an account and linked from another program.
    const programA = programNode({
        accounts: [accountNode({ data: definedTypeLinkNode('myType'), identifier: 'myAccount' })],
        definedTypes: [definedTypeNode({ identifier: 'myType', type: integerTypeNode('u8') })],
        identifier: 'programA',
        publicKey: '1111',
    });
    const programB = programNode({
        accounts: [
            accountNode({
                data: definedTypeLinkNode('myType', { program: programLinkNode('programA') }),
                identifier: 'myAccount',
            }),
        ],
        definedTypes: [definedTypeNode({ identifier: 'myType', type: integerTypeNode('u16') })],
        identifier: 'programB',
        publicKey: '2222',
    });

    // When we rename the defined type of the first program.
    const result = visit(
        rootNode(programA, { additionalPrograms: [programB] }),
        updateDefinedTypesVisitor({ 'programA.myType': { identifier: 'myNewType' } }),
    );

    // Then the type and both links pointing to it are renamed, but not the second program's type.
    assertIsNode(result, 'rootNode');
    expect(result.program.definedTypes?.[0].identifier).toBe('myNewType');
    expect(result.program.accounts?.[0].data).toStrictEqual(definedTypeLinkNode('myNewType'));
    expect(result.additionalPrograms?.[0].definedTypes?.[0].identifier).toBe('myType');
    expect(result.additionalPrograms?.[0].accounts?.[0].data).toStrictEqual(
        definedTypeLinkNode('myNewType', { program: programLinkNode('programA') }),
    );
});

test('it renames struct fields and repoints paths through links', () => {
    // Given a fixed-size struct type used as instruction data and referenced by a data value.
    const node = programNode({
        definedTypes: [
            definedTypeNode({
                identifier: 'transferArgs',
                type: structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })], {
                    transforms: [fixedSizeTransformNode(8)],
                }),
            }),
        ],
        identifier: 'myProgram',
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        defaultValue: dataValueNode('amount'),
                        identifier: 'meta',
                        isSigner: false,
                        isWritable: false,
                    }),
                ],
                data: definedTypeLinkNode('transferArgs'),
                identifier: 'transfer',
            }),
        ],
        publicKey: '1111',
    });

    // When we rename the struct field.
    const result = visit(node, updateDefinedTypesVisitor({ transferArgs: { data: { amount: 'lamports' } } }));

    // Then the field is renamed, the transforms kept and the data path repointed.
    assertIsNode(result, 'programNode');
    expect(result.definedTypes?.[0].type).toStrictEqual(
        structTypeNode([structFieldTypeNode({ identifier: 'lamports', type: integerTypeNode('u64') })], {
            transforms: [fixedSizeTransformNode(8)],
        }),
    );
    expect(result.instructions?.[0].accounts?.[0].defaultValue).toStrictEqual(dataValueNode('lamports'));
});

test('it renames enum variants and repoints enum values', () => {
    // Given an enum type with an explicit discriminator, used as a default value.
    const node = programNode({
        accounts: [
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        defaultValue: enumValueNode(definedTypeLinkNode('state'), 'active'),
                        identifier: 'state',
                        type: definedTypeLinkNode('state'),
                    }),
                ]),
                identifier: 'myAccount',
            }),
        ],
        definedTypes: [
            definedTypeNode({
                identifier: 'state',
                type: enumTypeNode([enumVariantTypeNode('active', { discriminator: 3 })]),
            }),
        ],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we rename both the type and its variant.
    const result = visit(
        node,
        updateDefinedTypesVisitor({ state: { data: { active: 'enabled' }, identifier: 'status' } }),
    );

    // Then the variant keeps its discriminator and the enum value is repointed.
    assertIsNode(result, 'programNode');
    expect(result.definedTypes?.[0]).toStrictEqual(
        definedTypeNode({
            identifier: 'status',
            type: enumTypeNode([enumVariantTypeNode('enabled', { discriminator: 3 })]),
        }),
    );
    const data = result.accounts?.[0].data;
    assertIsNode(data, 'structTypeNode');
    expect(data.fields?.[0].defaultValue).toStrictEqual(enumValueNode(definedTypeLinkNode('status'), 'enabled'));
});

test('it throws when renaming a member that does not exist', () => {
    // Given a struct type without a "missing" field.
    const definedType = definedTypeNode({
        identifier: 'myType',
        type: structTypeNode([structFieldTypeNode({ identifier: 'a', type: integerTypeNode('u8') })]),
    });

    // When we try to rename it, then we expect an error.
    expect(() => visit(definedType, updateDefinedTypesVisitor({ myType: { data: { missing: 'b' } } }))).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__DEFINED_TYPE_MEMBER_NOT_FOUND, {
            definedType,
            missingMember: 'missing',
            name: identifierString('myType'),
        }),
    );
});

test('it deletes defined types', () => {
    // Given a program with two defined types.
    const node = programNode({
        definedTypes: [
            definedTypeNode({ identifier: 'a', type: integerTypeNode('u8') }),
            definedTypeNode({ identifier: 'b', type: integerTypeNode('u8') }),
        ],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When we delete one of them, then only the other one remains.
    const result = visit(node, updateDefinedTypesVisitor({ a: { delete: true } }));
    assertIsNode(result, 'programNode');
    expect(result.definedTypes?.map(type => type.identifier)).toStrictEqual(['b']);
});

test('it merges updates from several entries matching the same defined type', () => {
    // Given a struct type with two fields.
    const node = programNode({
        definedTypes: [
            definedTypeNode({
                identifier: 'myType',
                type: structTypeNode([
                    structFieldTypeNode({ identifier: 'a', type: integerTypeNode('u8') }),
                    structFieldTypeNode({ identifier: 'b', type: integerTypeNode('u8') }),
                ]),
            }),
        ],
        identifier: 'myProgram',
        publicKey: '1111',
    });

    // When two entries rename both fields using their original identifiers.
    const result = visit(
        node,
        updateDefinedTypesVisitor({ 'myProgram.myType': { data: { a: 'x' } }, myType: { data: { b: 'y' } } }),
    );

    // Then both renames are applied.
    assertIsNode(result, 'programNode');
    expect(result.definedTypes?.[0].type).toStrictEqual(
        structTypeNode([
            structFieldTypeNode({ identifier: 'x', type: integerTypeNode('u8') }),
            structFieldTypeNode({ identifier: 'y', type: integerTypeNode('u8') }),
        ]),
    );
});
