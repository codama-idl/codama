import { CodecAndValueVisitors, getCodecAndValueVisitors } from '@codama/dynamic-codecs';
import {
    CODAMA_ERROR__DISCRIMINATOR_FIELD_HAS_NO_DEFAULT_VALUE,
    CODAMA_ERROR__DISCRIMINATOR_FIELD_NOT_FOUND,
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
    fixedSizeTypeNode,
    numberTypeNode,
    numberValueNode,
    programLinkNode,
    programNode,
    rootNode,
    sizeDiscriminatorNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { getRecordLinkablesVisitor, LinkableDictionary, NodeStack, visit } from '@codama/visitors-core';
import { beforeEach, describe, expect, test } from 'vitest';

import { matchDiscriminators } from '../src/discriminators';
import { hex } from './_setup';

describe('matchDiscriminators', () => {
    let linkables: LinkableDictionary;
    let codecAndValueVisitors: CodecAndValueVisitors;
    beforeEach(() => {
        linkables = new LinkableDictionary();
        codecAndValueVisitors = getCodecAndValueVisitors(linkables);
    });
    test('it does not match if no discriminators are provided', () => {
        const result = matchDiscriminators(hex('ff'), [], structTypeNode([]), codecAndValueVisitors);
        expect(result).toBe(false);
    });
    describe('size discriminators', () => {
        test('it returns true if the size matches exactly', () => {
            const result = matchDiscriminators(
                hex('0102030405'),
                [sizeDiscriminatorNode(5)],
                structTypeNode([]),
                codecAndValueVisitors,
            );
            expect(result).toBe(true);
        });
        test('it returns false if the size is lower', () => {
            const result = matchDiscriminators(
                hex('01020304'),
                [sizeDiscriminatorNode(5)],
                structTypeNode([]),
                codecAndValueVisitors,
            );
            expect(result).toBe(false);
        });
        test('it returns false if the size is greater', () => {
            const result = matchDiscriminators(
                hex('010203040506'),
                [sizeDiscriminatorNode(5)],
                structTypeNode([]),
                codecAndValueVisitors,
            );
            expect(result).toBe(false);
        });
    });
    describe('constant discriminators', () => {
        test('it returns true if the bytes start with the provided constant', () => {
            const discriminator = constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'ff'));
            const result = matchDiscriminators(
                hex('ff0102030405'),
                [discriminator],
                structTypeNode([]),
                codecAndValueVisitors,
            );
            expect(result).toBe(true);
        });
        test('it returns false if the bytes do not start with the provided constant', () => {
            const discriminator = constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'ff'));
            const result = matchDiscriminators(
                hex('aa0102030405'),
                [discriminator],
                structTypeNode([]),
                codecAndValueVisitors,
            );
            expect(result).toBe(false);
        });
        test('it returns true if the bytes match with the provided constant at the given offset', () => {
            const discriminator = constantDiscriminatorNode(
                constantValueNodeFromBytes('base16', 'ff'),
                3 /** offset */,
            );
            const result = matchDiscriminators(
                hex('010203ff0405'),
                [discriminator],
                structTypeNode([]),
                codecAndValueVisitors,
            );
            expect(result).toBe(true);
        });
        test('it returns false if the bytes do not match with the provided constant at the given offset', () => {
            const discriminator = constantDiscriminatorNode(
                constantValueNodeFromBytes('base16', 'ff'),
                3 /** offset */,
            );
            const result = matchDiscriminators(
                hex('010203aa0405'),
                [discriminator],
                structTypeNode([]),
                codecAndValueVisitors,
            );
            expect(result).toBe(false);
        });
        test('it resolves link nodes correctly', () => {
            // Given two link nodes designed so that the path would
            // fail if we did not save and restored linked paths.
            const discriminator = constantDiscriminatorNode(
                constantValueNode(definedTypeLinkNode('typeB1', programLinkNode('programB')), numberValueNode(42)),
            );
            const programA = programNode({
                accounts: [accountNode({ discriminators: [discriminator], name: 'myAccount' })],
                definedTypes: [
                    definedTypeNode({
                        name: 'typeA',
                        type: definedTypeLinkNode('typeB1', programLinkNode('programB')),
                    }),
                ],
                name: 'programA',
                publicKey: '1111',
            });
            const programB = programNode({
                definedTypes: [
                    definedTypeNode({ name: 'typeB1', type: definedTypeLinkNode('typeB2') }),
                    definedTypeNode({ name: 'typeB2', type: numberTypeNode('u32') }),
                ],
                name: 'programB',
                publicKey: '2222',
            });
            const root = rootNode(programA, [programB]);

            // And given a recorded linkables dictionary.
            const linkables = new LinkableDictionary();
            visit(root, getRecordLinkablesVisitor(linkables));

            // And a stack keeping track of the current visited nodes.
            const stack = new NodeStack([root, programA, programA.accounts[0]]);
            codecAndValueVisitors = getCodecAndValueVisitors(linkables, { stack });

            // When we match the discriminator which should resolve to a u32 number equal to 42.
            const result = matchDiscriminators(
                hex('2a0000000102030405'),
                [discriminator],
                structTypeNode([]),
                codecAndValueVisitors,
            );

            // Then we expect the discriminator to match.
            expect(result).toBe(true);
        });
    });
    describe('field discriminators', () => {
        test('it returns true if the bytes start with the provided field default value', () => {
            const discriminator = fieldDiscriminatorNode('key');
            const fields = structTypeNode([
                structFieldTypeNode({
                    defaultValue: numberValueNode(0xff),
                    name: 'key',
                    type: numberTypeNode('u8'),
                }),
            ]);
            const result = matchDiscriminators(hex('ff0102030405'), [discriminator], fields, codecAndValueVisitors);
            expect(result).toBe(true);
        });
        test('it returns false if the bytes do not start with the provided field default value', () => {
            const discriminator = fieldDiscriminatorNode('key');
            const fields = structTypeNode([
                structFieldTypeNode({
                    defaultValue: numberValueNode(0xff),
                    name: 'key',
                    type: numberTypeNode('u8'),
                }),
            ]);
            const result = matchDiscriminators(hex('aa0102030405'), [discriminator], fields, codecAndValueVisitors);
            expect(result).toBe(false);
        });
        test('it returns true if the bytes match with the provided field default value at the given offset', () => {
            const discriminator = fieldDiscriminatorNode('key', 3 /** offset */);
            const fields = structTypeNode([
                structFieldTypeNode({ name: 'id', type: fixedSizeTypeNode(stringTypeNode('utf8'), 3) }),
                structFieldTypeNode({
                    defaultValue: numberValueNode(0xff),
                    name: 'key',
                    type: numberTypeNode('u8'),
                }),
            ]);
            const result = matchDiscriminators(hex('010203ff0405'), [discriminator], fields, codecAndValueVisitors);
            expect(result).toBe(true);
        });
        test('it returns false if the bytes do not match with the provided field default value at the given offset', () => {
            const discriminator = fieldDiscriminatorNode('key', 3 /** offset */);
            const fields = structTypeNode([
                structFieldTypeNode({ name: 'id', type: fixedSizeTypeNode(stringTypeNode('utf8'), 3) }),
                structFieldTypeNode({
                    defaultValue: numberValueNode(0xff),
                    name: 'key',
                    type: numberTypeNode('u8'),
                }),
            ]);
            const result = matchDiscriminators(hex('010203aa0405'), [discriminator], fields, codecAndValueVisitors);
            expect(result).toBe(false);
        });
        test('it throws an error if the discriminator field is not found', () => {
            const discriminator = fieldDiscriminatorNode('key');
            const fields = structTypeNode([]);
            expect(() =>
                matchDiscriminators(hex('0102030405'), [discriminator], fields, codecAndValueVisitors),
            ).toThrow(new CodamaError(CODAMA_ERROR__DISCRIMINATOR_FIELD_NOT_FOUND, { field: 'key' }));
        });
        test('it throws an error if the discriminator field does not have a default value', () => {
            const discriminator = fieldDiscriminatorNode('key');
            const fields = structTypeNode([
                structFieldTypeNode({
                    name: 'key',
                    type: numberTypeNode('u8'),
                }),
            ]);
            expect(() =>
                matchDiscriminators(hex('0102030405'), [discriminator], fields, codecAndValueVisitors),
            ).toThrow(new CodamaError(CODAMA_ERROR__DISCRIMINATOR_FIELD_HAS_NO_DEFAULT_VALUE, { field: 'key' }));
        });
        test('it resolves link nodes correctly', () => {
            // Given two link nodes designed so that the path would
            // fail if we did not save and restored linked paths.
            const discriminator = fieldDiscriminatorNode('key');
            const fields = structTypeNode([
                structFieldTypeNode({
                    defaultValue: numberValueNode(42),
                    name: 'key',
                    type: definedTypeLinkNode('typeB1', programLinkNode('programB')),
                }),
            ]);
            const programA = programNode({
                accounts: [accountNode({ data: fields, discriminators: [discriminator], name: 'myAccount' })],
                definedTypes: [
                    definedTypeNode({
                        name: 'typeA',
                        type: definedTypeLinkNode('typeB1', programLinkNode('programB')),
                    }),
                ],
                name: 'programA',
                publicKey: '1111',
            });
            const programB = programNode({
                definedTypes: [
                    definedTypeNode({ name: 'typeB1', type: definedTypeLinkNode('typeB2') }),
                    definedTypeNode({ name: 'typeB2', type: numberTypeNode('u32') }),
                ],
                name: 'programB',
                publicKey: '2222',
            });
            const root = rootNode(programA, [programB]);

            // And given a recorded linkables dictionary.
            const linkables = new LinkableDictionary();
            visit(root, getRecordLinkablesVisitor(linkables));

            // And a stack keeping track of the current visited nodes.
            const stack = new NodeStack([root, programA, programA.accounts[0]]);
            codecAndValueVisitors = getCodecAndValueVisitors(linkables, { stack });

            // When we match the discriminator which should resolve to a u32 number equal to 42.
            const result = matchDiscriminators(
                hex('2a0000000102030405'),
                [discriminator],
                fields,
                codecAndValueVisitors,
            );

            // Then we expect the discriminator to match.
            expect(result).toBe(true);
        });
    });
    describe('multiple discriminators', () => {
        test('it returns true if all discriminators match', () => {
            const result = matchDiscriminators(
                hex('ff0102030405'),
                [constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'ff')), sizeDiscriminatorNode(6)],
                structTypeNode([]),
                codecAndValueVisitors,
            );
            expect(result).toBe(true);
        });
        test('it returns false if any discriminator does not match', () => {
            const result = matchDiscriminators(
                hex('ff0102030405'),
                [constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'ff')), sizeDiscriminatorNode(999)],
                structTypeNode([]),
                codecAndValueVisitors,
            );
            expect(result).toBe(false);
        });
        test('it can match on all discriminator types', () => {
            const result = matchDiscriminators(
                hex('aabb01020304'),
                [
                    fieldDiscriminatorNode('key'),
                    constantDiscriminatorNode(constantValueNodeFromBytes('base16', 'bb'), 1),
                    sizeDiscriminatorNode(6),
                ],
                structTypeNode([
                    structFieldTypeNode({
                        defaultValue: numberValueNode(0xaa),
                        name: 'key',
                        type: numberTypeNode('u8'),
                    }),
                ]),
                codecAndValueVisitors,
            );
            expect(result).toBe(true);
        });
    });
});
