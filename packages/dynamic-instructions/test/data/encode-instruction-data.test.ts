import {
    CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE,
    CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED,
} from '@codama/errors';
import { getBase16Encoder } from '@solana/codecs';
import {
    definedTypeLinkNode,
    definedTypeNode,
    injectedValueNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    providedNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { encodeInstructionData } from '../../src';
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

    test('it throws value type errors as is', () => {
        const instruction = instructionNode({ data, identifier: 'transfer' });
        const path = getInstructionPath(instruction);
        expect(() => encodeInstructionData(path, { amount: 'abc' })).toThrow(
            expect.objectContaining({
                context: {
                    __code: CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE,
                    actualType: 'string',
                    expectedType: 'integer (number | bigint)',
                    nodeKind: 'integerTypeNode',
                    nodePath: [...path, data, amount, amountType],
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

    test('it wraps other encoding errors', () => {
        const path = getInstructionPath(instructionNode({ data, identifier: 'transfer' }));
        expect(() => encodeInstructionData(path, { amount: 300 })).toThrow(
            expect.objectContaining({
                cause: expect.objectContaining({ message: expect.stringContaining('300') }),
                context: { __code: CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA, instructionName: 'transfer' },
            }),
        );
    });
});
