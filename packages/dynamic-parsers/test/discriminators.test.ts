import { getCodecAndValueVisitors } from '@codama/dynamic-codecs';
import {
    CODAMA_ERROR__DISCRIMINATOR_FIELD_HAS_NO_DEFAULT_VALUE,
    CODAMA_ERROR__DISCRIMINATOR_FIELD_NOT_FOUND,
    CODAMA_ERROR__LINKED_NODE_NOT_FOUND,
    CodamaError,
} from '@codama/errors';
import {
    accountNode,
    constantDiscriminatorNode,
    constantValueNode,
    constantValueNodeFromBytes,
    definedTypeLinkNode,
    definedTypeNode,
    fieldDiscriminatorNode,
    fixedSizeTransformNode,
    integerTypeNode,
    integerValueNode,
    programLinkNode,
    pathString,
    programNode,
    rootNode,
    sizeDiscriminatorNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { getRecordLinkablesVisitor, LinkableDictionary, NodeStack, ProvidedScope, visit } from '@codama/visitors-core';
import { beforeEach, describe, expect, test } from 'vitest';

import { DiscriminatorContext, matchDiscriminators } from '../src/discriminators';
import { hex } from './_setup';

function getContext(linkables: LinkableDictionary, stack: NodeStack): DiscriminatorContext {
    const scope = new ProvidedScope();
    return { ...getCodecAndValueVisitors(linkables, { scope, stack }), linkables, scope, stack };
}

describe('matchDiscriminators', () => {
    let linkables: LinkableDictionary;
    let context: DiscriminatorContext;
    beforeEach(() => {
        linkables = new LinkableDictionary();
        context = getContext(linkables, new NodeStack());
    });
    test('it does not match if no discriminators are provided', () => {
        const result = matchDiscriminators(hex('ff'), [], structTypeNode([]), context);
        expect(result).toBe(false);
    });
    describe('size discriminators', () => {
        test('it returns true if the size matches exactly', () => {
            const result = matchDiscriminators(
                hex('0102030405'),
                [sizeDiscriminatorNode(5)],
                structTypeNode([]),
                context,
            );
            expect(result).toBe(true);
        });
        test('it returns false if the size is lower', () => {
            const result = matchDiscriminators(
                hex('01020304'),
                [sizeDiscriminatorNode(5)],
                structTypeNode([]),
                context,
            );
            expect(result).toBe(false);
        });
        test('it returns false if the size is greater', () => {
            const result = matchDiscriminators(
                hex('010203040506'),
                [sizeDiscriminatorNode(5)],
                structTypeNode([]),
                context,
            );
            expect(result).toBe(false);
        });
    });
    describe('constant discriminators', () => {
        test('it returns true if the bytes start with the provided constant', () => {
            const discriminator = constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'ff'));
            const result = matchDiscriminators(hex('ff0102030405'), [discriminator], structTypeNode([]), context);
            expect(result).toBe(true);
        });
        test('it returns false if the bytes do not start with the provided constant', () => {
            const discriminator = constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'ff'));
            const result = matchDiscriminators(hex('aa0102030405'), [discriminator], structTypeNode([]), context);
            expect(result).toBe(false);
        });
        test('it returns true if the bytes match with the provided constant at the given offset', () => {
            const discriminator = constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'ff'), { offset: 3 });
            const result = matchDiscriminators(hex('010203ff0405'), [discriminator], structTypeNode([]), context);
            expect(result).toBe(true);
        });
        test('it returns false if the bytes do not match with the provided constant at the given offset', () => {
            const discriminator = constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'ff'), { offset: 3 });
            const result = matchDiscriminators(hex('010203aa0405'), [discriminator], structTypeNode([]), context);
            expect(result).toBe(false);
        });
        test('it resolves link nodes correctly', () => {
            // Given two link nodes designed so that the path would
            // fail if we did not save and restored linked paths.
            const discriminator = constantDiscriminatorNode(
                constantValueNode(
                    definedTypeLinkNode('typeB1', { program: programLinkNode('programB') }),
                    integerValueNode('42'),
                ),
            );
            const account = accountNode({ discriminators: [discriminator], identifier: 'myAccount' });
            const programA = programNode({
                accounts: [account],
                definedTypes: [
                    definedTypeNode({
                        identifier: 'typeA',
                        type: definedTypeLinkNode('typeB1', { program: programLinkNode('programB') }),
                    }),
                ],
                identifier: 'programA',
                publicKey: '1111',
            });
            const programB = programNode({
                definedTypes: [
                    definedTypeNode({ identifier: 'typeB1', type: definedTypeLinkNode('typeB2') }),
                    definedTypeNode({ identifier: 'typeB2', type: integerTypeNode('u32') }),
                ],
                identifier: 'programB',
                publicKey: '2222',
            });
            const root = rootNode(programA, { additionalPrograms: [programB] });

            // And given a recorded linkables dictionary.
            const linkables = new LinkableDictionary();
            visit(root, getRecordLinkablesVisitor(linkables));

            // And a stack keeping track of the current visited nodes.
            const stack = new NodeStack([root, programA, account]);
            context = getContext(linkables, stack);

            // When we match the discriminator which should resolve to a u32 number equal to 42.
            const result = matchDiscriminators(hex('2a0000000102030405'), [discriminator], structTypeNode([]), context);

            // Then we expect the discriminator to match.
            expect(result).toBe(true);
        });
    });
    describe('field discriminators', () => {
        test('it returns true if the bytes start with the provided field default value', () => {
            const discriminator = fieldDiscriminatorNode('key');
            const fields = structTypeNode([
                structFieldTypeNode({
                    defaultValue: integerValueNode('255'),
                    identifier: 'key',
                    type: integerTypeNode('u8'),
                }),
            ]);
            const result = matchDiscriminators(hex('ff0102030405'), [discriminator], fields, context);
            expect(result).toBe(true);
        });
        test('it returns false if the bytes do not start with the provided field default value', () => {
            const discriminator = fieldDiscriminatorNode('key');
            const fields = structTypeNode([
                structFieldTypeNode({
                    defaultValue: integerValueNode('255'),
                    identifier: 'key',
                    type: integerTypeNode('u8'),
                }),
            ]);
            const result = matchDiscriminators(hex('aa0102030405'), [discriminator], fields, context);
            expect(result).toBe(false);
        });
        test('it returns true if the bytes match with the provided field default value at the given offset', () => {
            const discriminator = fieldDiscriminatorNode('key', { offset: 3 });
            const fields = structTypeNode([
                structFieldTypeNode({
                    identifier: 'id',
                    type: stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(3)] }),
                }),
                structFieldTypeNode({
                    defaultValue: integerValueNode('255'),
                    identifier: 'key',
                    type: integerTypeNode('u8'),
                }),
            ]);
            const result = matchDiscriminators(hex('010203ff0405'), [discriminator], fields, context);
            expect(result).toBe(true);
        });
        test('it returns false if the bytes do not match with the provided field default value at the given offset', () => {
            const discriminator = fieldDiscriminatorNode('key', { offset: 3 });
            const fields = structTypeNode([
                structFieldTypeNode({
                    identifier: 'id',
                    type: stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(3)] }),
                }),
                structFieldTypeNode({
                    defaultValue: integerValueNode('255'),
                    identifier: 'key',
                    type: integerTypeNode('u8'),
                }),
            ]);
            const result = matchDiscriminators(hex('010203aa0405'), [discriminator], fields, context);
            expect(result).toBe(false);
        });
        test('it throws an error if the discriminator field is not found', () => {
            const discriminator = fieldDiscriminatorNode('key');
            const fields = structTypeNode([]);
            expect(() => matchDiscriminators(hex('0102030405'), [discriminator], fields, context)).toThrow(
                new CodamaError(CODAMA_ERROR__DISCRIMINATOR_FIELD_NOT_FOUND, { field: pathString('key') }),
            );
        });
        test('it throws an error if the discriminator field does not have a default value', () => {
            const discriminator = fieldDiscriminatorNode('key');
            const fields = structTypeNode([
                structFieldTypeNode({
                    identifier: 'key',
                    type: integerTypeNode('u8'),
                }),
            ]);
            expect(() => matchDiscriminators(hex('0102030405'), [discriminator], fields, context)).toThrow(
                new CodamaError(CODAMA_ERROR__DISCRIMINATOR_FIELD_HAS_NO_DEFAULT_VALUE, {
                    field: pathString('key'),
                }),
            );
        });
        test('it resolves link nodes correctly', () => {
            // Given two link nodes designed so that the path would
            // fail if we did not save and restored linked paths.
            const discriminator = fieldDiscriminatorNode('key');
            const fields = structTypeNode([
                structFieldTypeNode({
                    defaultValue: integerValueNode('42'),
                    identifier: 'key',
                    type: definedTypeLinkNode('typeB1', { program: programLinkNode('programB') }),
                }),
            ]);
            const account = accountNode({ data: fields, discriminators: [discriminator], identifier: 'myAccount' });
            const programA = programNode({
                accounts: [account],
                definedTypes: [
                    definedTypeNode({
                        identifier: 'typeA',
                        type: definedTypeLinkNode('typeB1', { program: programLinkNode('programB') }),
                    }),
                ],
                identifier: 'programA',
                publicKey: '1111',
            });
            const programB = programNode({
                definedTypes: [
                    definedTypeNode({ identifier: 'typeB1', type: definedTypeLinkNode('typeB2') }),
                    definedTypeNode({ identifier: 'typeB2', type: integerTypeNode('u32') }),
                ],
                identifier: 'programB',
                publicKey: '2222',
            });
            const root = rootNode(programA, { additionalPrograms: [programB] });

            // And given a recorded linkables dictionary.
            const linkables = new LinkableDictionary();
            visit(root, getRecordLinkablesVisitor(linkables));

            // And a stack keeping track of the current visited nodes.
            const stack = new NodeStack([root, programA, account]);
            context = getContext(linkables, stack);

            // When we match the discriminator which should resolve to a u32 number equal to 42.
            const result = matchDiscriminators(hex('2a0000000102030405'), [discriminator], fields, context);

            // Then we expect the discriminator to match.
            expect(result).toBe(true);
        });
    });
    describe('nested field discriminators', () => {
        test('it matches a field nested within a linked struct of another program', () => {
            // Given account data whose `header` field links to a struct of programB holding the `kind` field.
            const discriminator = fieldDiscriminatorNode('header.kind', { offset: 1 });
            const data = structTypeNode([
                structFieldTypeNode({
                    identifier: 'header',
                    type: definedTypeLinkNode('header', { program: programLinkNode('programB') }),
                }),
            ]);
            const account = accountNode({ data, discriminators: [discriminator], identifier: 'myAccount' });
            const programA = programNode({ accounts: [account], identifier: 'programA', publicKey: '1111' });
            const programB = programNode({
                definedTypes: [
                    definedTypeNode({
                        identifier: 'header',
                        type: structTypeNode([
                            structFieldTypeNode({ identifier: 'version', type: integerTypeNode('u8') }),
                            structFieldTypeNode({
                                defaultValue: integerValueNode('42'),
                                identifier: 'kind',
                                type: definedTypeLinkNode('kind'),
                            }),
                        ]),
                    }),
                    definedTypeNode({ identifier: 'kind', type: integerTypeNode('u16') }),
                ],
                identifier: 'programB',
                publicKey: '2222',
            });
            const root = rootNode(programA, { additionalPrograms: [programB] });
            visit(root, getRecordLinkablesVisitor(linkables));
            context = getContext(linkables, new NodeStack([root, programA, account]));

            // Then the `kind` link resolves within programB, as a u16 at offset 1.
            expect(matchDiscriminators(hex('012a00'), [discriminator], data, context)).toBe(true);
            expect(matchDiscriminators(hex('012b00'), [discriminator], data, context)).toBe(false);
        });

        test('it matches a field of data that is itself a linked type', () => {
            // Given account data that links to a struct holding the `key` field.
            const discriminator = fieldDiscriminatorNode('key');
            const data = definedTypeLinkNode('accountData');
            const account = accountNode({ data, discriminators: [discriminator], identifier: 'myAccount' });
            const program = programNode({
                accounts: [account],
                definedTypes: [
                    definedTypeNode({
                        identifier: 'accountData',
                        type: structTypeNode([
                            structFieldTypeNode({
                                defaultValue: integerValueNode('7'),
                                identifier: 'key',
                                type: integerTypeNode('u8'),
                            }),
                        ]),
                    }),
                ],
                identifier: 'myProgram',
                publicKey: '1111',
            });
            const root = rootNode(program);
            visit(root, getRecordLinkablesVisitor(linkables));
            context = getContext(linkables, new NodeStack([root, program, account]));

            // Then the field is found through the link.
            expect(matchDiscriminators(hex('07'), [discriminator], data, context)).toBe(true);
        });

        test('it throws when a link within the path cannot be resolved', () => {
            // Given account data whose `header` field links to a type that does not exist.
            const discriminator = fieldDiscriminatorNode('header.kind');
            const link = definedTypeLinkNode('missing');
            const header = structFieldTypeNode({ identifier: 'header', type: link });
            const data = structTypeNode([header]);
            const account = accountNode({ data, discriminators: [discriminator], identifier: 'myAccount' });
            const program = programNode({ accounts: [account], identifier: 'myProgram', publicKey: '1111' });
            const root = rootNode(program);
            visit(root, getRecordLinkablesVisitor(linkables));
            context = getContext(linkables, new NodeStack([root, program, account]));

            // Then the dangling link is reported rather than a missing field.
            expect(() => matchDiscriminators(hex('00'), [discriminator], data, context)).toThrow(
                new CodamaError(CODAMA_ERROR__LINKED_NODE_NOT_FOUND, {
                    kind: 'definedTypeLinkNode',
                    linkNode: link,
                    name: link.identifier,
                    path: [root, program, account, data, header, link],
                }),
            );
        });

        test('it throws when a segment of the path is not a struct field', () => {
            const discriminator = fieldDiscriminatorNode('header.kind');
            const data = structTypeNode([structFieldTypeNode({ identifier: 'header', type: integerTypeNode('u8') })]);
            expect(() => matchDiscriminators(hex('00'), [discriminator], data, context)).toThrow(
                new CodamaError(CODAMA_ERROR__DISCRIMINATOR_FIELD_NOT_FOUND, { field: pathString('header.kind') }),
            );
        });
    });

    describe('multiple discriminators', () => {
        test('it returns true if all discriminators match', () => {
            const result = matchDiscriminators(
                hex('ff0102030405'),
                [constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'ff')), sizeDiscriminatorNode(6)],
                structTypeNode([]),
                context,
            );
            expect(result).toBe(true);
        });
        test('it returns false if any discriminator does not match', () => {
            const result = matchDiscriminators(
                hex('ff0102030405'),
                [constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'ff')), sizeDiscriminatorNode(999)],
                structTypeNode([]),
                context,
            );
            expect(result).toBe(false);
        });
        test('it can match on all discriminator types', () => {
            const result = matchDiscriminators(
                hex('aabb01020304'),
                [
                    fieldDiscriminatorNode('key'),
                    constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'bb'), { offset: 1 }),
                    sizeDiscriminatorNode(6),
                ],
                structTypeNode([
                    structFieldTypeNode({
                        defaultValue: integerValueNode('170'),
                        identifier: 'key',
                        type: integerTypeNode('u8'),
                    }),
                ]),
                context,
            );
            expect(result).toBe(true);
        });
    });
});
