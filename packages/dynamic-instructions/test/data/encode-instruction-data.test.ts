import {
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE,
    CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED,
    CODAMA_ERROR__LINKED_NODE_NOT_FOUND,
} from '@codama/errors';
import { getBase16Encoder } from '@solana/codecs';
import { SOLANA_ERROR__CODECS__INVALID_NUMBER_OF_ITEMS } from '@solana/kit';
import {
    accountDataValueNode,
    arrayTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    fixedCountNode,
    injectedValueNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    LinkableDictionary,
    providedNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { createInstructionDataEncoder, encodeInstructionData } from '../../src';
import { getInstructionPath } from '../_setup';

const hex = (value: string) => getBase16Encoder().encode(value);

const amountType = integerTypeNode('u8');
const amount = structFieldTypeNode({ identifier: 'amount', type: amountType });
const discriminator = structFieldTypeNode({
    defaultValue: integerValueNode('3'),
    defaultValueStrategy: 'omitted',
    identifier: 'discriminator',
    type: integerTypeNode('u8'),
});
const data = structTypeNode([discriminator, amount]);

describe('encodeInstructionData', () => {
    test('it encodes the data of instructions, including their default values', () => {
        const path = getInstructionPath(instructionNode({ data, identifier: 'transfer' }));
        expect(encodeInstructionData(path, { amount: 42 })).toStrictEqual(hex('032a'));
    });

    test('it encodes instructions without data to empty bytes', () => {
        const path = getInstructionPath(instructionNode({ identifier: 'noop' }));
        expect(encodeInstructionData(path)).toStrictEqual(hex(''));
    });

    test('it encodes linked data types', () => {
        const args = definedTypeNode({ identifier: 'transferArgs', type: data });
        const path = getInstructionPath(
            instructionNode({ data: definedTypeLinkNode('transferArgs'), identifier: 'transfer' }),
            { definedTypes: [args] },
        );
        expect(encodeInstructionData(path, { amount: 42 })).toStrictEqual(hex('032a'));
    });

    test('it uses the given linkables rather than recording them', () => {
        const args = definedTypeNode({ identifier: 'transferArgs', type: data });
        const path = getInstructionPath(
            instructionNode({ data: definedTypeLinkNode('transferArgs'), identifier: 'transfer' }),
            { definedTypes: [args] },
        );
        const linkables = new LinkableDictionary();
        const linkedNodeNotFound = expect.objectContaining({
            context: expect.objectContaining({ __code: CODAMA_ERROR__LINKED_NODE_NOT_FOUND }),
        });
        expect(() => createInstructionDataEncoder(path, linkables)).toThrow(linkedNodeNotFound);
        expect(() => encodeInstructionData(path, { amount: 42 }, { linkables })).toThrow(linkedNodeNotFound);
    });

    test('it resolves injected default values from the instruction', () => {
        const fee = structFieldTypeNode({
            defaultValue: injectedValueNode({ key: 'fee' }),
            identifier: 'fee',
            type: integerTypeNode('u8'),
        });
        const path = getInstructionPath(
            instructionNode({
                data: structTypeNode([fee]),
                identifier: 'pay',
                provides: [providedNode('fee', integerValueNode('7'))],
            }),
        );
        expect(encodeInstructionData(path, {})).toStrictEqual(hex('07'));
    });

    test('it resolves injected default values from parent instructions', () => {
        // Given a sub-instruction whose fee is provided by its parent.
        const fee = structFieldTypeNode({
            defaultValue: injectedValueNode({ key: 'fee' }),
            identifier: 'fee',
            type: integerTypeNode('u8'),
        });
        const child = instructionNode({ data: structTypeNode([fee]), identifier: 'child' });
        const parent = instructionNode({
            identifier: 'parent',
            provides: [providedNode('fee', integerValueNode('7'))],
            subInstructions: [child],
        });
        const [root, program] = getInstructionPath(parent);

        // Then encoding the sub-instruction uses the provided fee.
        expect(encodeInstructionData([root, program, parent, child], {})).toStrictEqual(hex('07'));
    });

    test('it throws value type errors as is', () => {
        const instruction = instructionNode({ data, identifier: 'transfer' });
        const path = getInstructionPath(instruction);
        expect(() => encodeInstructionData(path, { amount: 'abc' })).toThrow(
            expect.objectContaining({
                context: {
                    __code: CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE,
                    actualType: 'string',
                    expectedType: 'integer (number | bigint)',
                    path: [...path, data, amount, amountType],
                },
            }),
        );
    });

    test('it throws other Codama errors as is', () => {
        const fee = structFieldTypeNode({
            defaultValue: injectedValueNode({ key: 'fee' }),
            identifier: 'fee',
            type: integerTypeNode('u8'),
        });
        const path = getInstructionPath(instructionNode({ data: structTypeNode([fee]), identifier: 'pay' }));
        expect(() => encodeInstructionData(path, {})).toThrow(
            expect.objectContaining({
                context: expect.objectContaining({ __code: CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED, key: 'fee' }),
            }),
        );
    });

    test('it throws out-of-range integers as value type errors', () => {
        const path = getInstructionPath(instructionNode({ data, identifier: 'transfer' }));
        expect(() => encodeInstructionData(path, { amount: 300 })).toThrow(
            expect.objectContaining({
                context: {
                    __code: CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE,
                    actualType: 'number (300)',
                    expectedType: 'integer between 0 and 255',
                    path: [...path, data, amount, amountType],
                },
            }),
        );
    });

    test('it wraps other encoding errors', () => {
        // Given a fixed-count array, which Kit checks the number of items of.
        const items = structFieldTypeNode({
            identifier: 'items',
            type: arrayTypeNode(integerTypeNode('u8'), fixedCountNode(2)),
        });
        const path = getInstructionPath(instructionNode({ data: structTypeNode([items]), identifier: 'store' }));
        expect(() => encodeInstructionData(path, { items: [1, 2, 3] })).toThrow(
            expect.objectContaining({
                cause: expect.objectContaining({
                    context: expect.objectContaining({ __code: SOLANA_ERROR__CODECS__INVALID_NUMBER_OF_ITEMS }),
                }),
                context: { __code: CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA, path },
            }),
        );
    });

    test('it encodes resolved default values', () => {
        // Given a fee injected from account data, which codecs cannot read.
        const fee = structFieldTypeNode({
            defaultValue: injectedValueNode({ key: 'fee' }),
            identifier: 'fee',
            type: integerTypeNode('u8'),
        });
        const pay = instructionNode({
            data: structTypeNode([fee]),
            identifier: 'pay',
            provides: [providedNode('fee', accountDataValueNode('config', { path: 'fee' }))],
        });

        // Then it encodes its value resolved beforehand.
        const resolvedDefaultValues = new Map([[fee, 5]]);
        expect(encodeInstructionData(getInstructionPath(pay), {}, { resolvedDefaultValues })).toStrictEqual(hex('05'));
    });
});
