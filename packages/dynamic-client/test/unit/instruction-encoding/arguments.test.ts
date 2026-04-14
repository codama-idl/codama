import { CodamaError } from '@codama/errors';
import { address } from '@solana/addresses';
import { getU32Encoder, getU64Encoder, mergeBytes } from '@solana/codecs';
import { getInitializeInstructionDataDecoder } from '@solana-program/program-metadata';
import type { InstructionNode, RootNode } from 'codama';
import { describe, expect, test } from 'vitest';

import { createArgumentsInputValidator, encodeInstructionArguments } from '../../../src/instruction-encoding/arguments';
import { getCodecFromBytesEncoding } from '../../../src/shared/bytes-encoding';
import { loadRoot } from '../../programs/test-utils';

function getInstruction(root: RootNode, name: string): InstructionNode {
    const ix = root.program.instructions.find(i => i.name === name);
    if (!ix) throw new Error(`Instruction ${name} not found`);
    return ix;
}

describe('Instruction encoding: encodeInstructionArguments', () => {
    test('should encode omitted discriminator using default numberValueNode', () => {
        // pmp-idl.json 'write' instruction has discriminator with defaultValue: numberValueNode(0)
        const root = loadRoot('pmp-idl.json');
        const ix = getInstruction(root, 'write');

        const encoded = encodeInstructionArguments(root, ix, {
            data: null,
            offset: 2,
        });

        // discriminator: u8 + offset: u32
        expect(encoded).toEqual(new Uint8Array([0, 2, 0, 0, 0]));
    });

    test('should encode omitted discriminator using default bytesValueNode', () => {
        const root = loadRoot('example-idl.json');
        const ix = getInstruction(root, 'updateOptionalInput');

        const encoded = encodeInstructionArguments(root, ix, {
            input: 42n,
            optionalInput: null,
        });

        // discriminator defaulValue from updateOptionalInput:
        const expectedDiscriminator = getCodecFromBytesEncoding('base16').encode('1f094566b31b79c7');
        const expectedInput = getU64Encoder().encode(42n);
        const expectedOptionalInput = new Uint8Array([0]);
        expect(encoded).toEqual(
            mergeBytes([
                expectedDiscriminator as Uint8Array,
                expectedInput as Uint8Array,
                expectedOptionalInput as Uint8Array,
            ]),
        );
    });

    test('should transform Uint8Array in remainderOptionTypeNode argument', () => {
        const root = loadRoot('pmp-idl.json');
        const ix = getInstruction(root, 'write');

        const testData = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
        const encoded = encodeInstructionArguments(root, ix, {
            data: testData,
            offset: 10,
        });

        const expected = mergeBytes([new Uint8Array([0]), getU32Encoder().encode(10) as Uint8Array, testData]);
        expect(encoded).toEqual(expected);
    });

    test('should resolve definedTypeLinkNode to enumTypeNode', () => {
        const root = loadRoot('pmp-idl.json');
        const ix = getInstruction(root, 'initialize');

        // seed is a fixedSizeTypeNode(16, stringTypeNode) - needs 16-byte padded string
        // Enums use lowercase variant names: none=0, utf8=1, gzip=1, json=1, direct=0, etc.
        const encoded = encodeInstructionArguments(root, ix, {
            compression: 'gzip', // gzip=1
            data: null,
            dataSource: 'url', // url=1
            encoding: 'base64', // base64=3
            format: 'json', // json=1
            seed: 'test', // fixed 16-byte string, null-padded
        });

        const expected = getInitializeInstructionDataDecoder().decode(encoded);
        expect(encoded.length).toBe(21);
        expect(expected.discriminator).toBe(1);
        expect(expected.seed).toBe('test');
        expect(expected.encoding).toBe(3);
        expect(expected.compression).toBe(1);
        expect(expected.format).toBe(1);
        expect(expected.dataSource).toBe(1);
    });

    test('should throw ARGUMENT_MISSING for missing required argument', () => {
        const root = loadRoot('pmp-idl.json');
        const ix = getInstruction(root, 'write');

        expect(() => encodeInstructionArguments(root, ix, {})).toThrow('Missing argument [offset] in [write].');
    });

    test('should throw DEFAULT_VALUE_MISSING when omitted argument has no defaultValue', () => {
        const root = loadRoot('pmp-idl.json');
        const ix = getInstruction(root, 'write');

        // Create a modified instruction where the omitted discriminator has no defaultValue.
        const modifiedIx: InstructionNode = {
            ...ix,
            arguments: ix.arguments.map(arg =>
                arg.name === 'discriminator' ? { ...arg, defaultValue: undefined } : arg,
            ),
        };

        expect(() => encodeInstructionArguments(root, modifiedIx, { data: null, offset: 0 })).toThrow(
            'Default value is missing for argument [discriminator] in [write].',
        );
    });

    test('should throw ValidationError when omitted argument is provided', () => {
        const root = loadRoot('pmp-idl.json');
        const ix = getInstruction(root, 'write');

        // discriminator should be omitted due to strategy
        const validate = createArgumentsInputValidator(root, ix);
        expect(() =>
            validate({
                data: null,
                discriminator: 99,
                offset: 0,
            }),
        ).toThrow(CodamaError);
    });

    test('should encode instruction with only omitted discriminator (no user args)', () => {
        const root = loadRoot('pmp-idl.json');
        const ix = getInstruction(root, 'close');

        const encoded = encodeInstructionArguments(root, ix, {});
        const discriminator = 6;
        expect(encoded).toEqual(new Uint8Array([discriminator]));
    });
});

describe('Instruction validation: remaining account arguments', () => {
    const ADDR_1 = address('11111111111111111111111111111111');
    const ADDR_2 = address('22222222222222222222222222222222222222222222');

    test('should not reject remaining account args as extra keys', () => {
        // initializeMultisig has remainingAccounts referencing "signers" argumentValueNode
        // superstruct's object() rejects unknown keys, so "signers" must be stripped before validation
        const root = loadRoot('token-idl.json');
        const ix = getInstruction(root, 'initializeMultisig');

        const validate = createArgumentsInputValidator(root, ix);
        expect(() => validate({ m: 2, signers: [ADDR_1, ADDR_2] })).not.toThrow();
    });

    test('should still validate regular arguments when remaining account args are present', () => {
        const root = loadRoot('token-idl.json');
        const ix = getInstruction(root, 'initializeMultisig');

        // m is a required number argument — passing a string should fail validation
        const validate = createArgumentsInputValidator(root, ix);
        expect(() => validate({ m: 'invalid', signers: [ADDR_1] })).toThrow('Invalid argument "m"');
    });

    test('should not reject optional remaining account args when omitted', () => {
        // transfer has optional multiSigners remaining accounts
        const root = loadRoot('token-idl.json');
        const ix = getInstruction(root, 'transfer');

        const validate = createArgumentsInputValidator(root, ix);
        expect(() => validate({ amount: 100 })).not.toThrow();
    });

    test('should not reject optional remaining account args when provided', () => {
        const root = loadRoot('token-idl.json');
        const ix = getInstruction(root, 'transfer');

        const validate = createArgumentsInputValidator(root, ix);
        expect(() => validate({ amount: 100, multiSigners: [ADDR_1] })).not.toThrow();
    });

    test('should not encode remaining account args as instruction data', () => {
        const root = loadRoot('token-idl.json');
        const ix = getInstruction(root, 'initializeMultisig');

        const withSigners = encodeInstructionArguments(root, ix, { m: 2, signers: [ADDR_1, ADDR_2] });
        const withoutSigners = encodeInstructionArguments(root, ix, { m: 2 });

        // Remaining account args should not affect encoded data
        expect(withSigners).toEqual(withoutSigners);
    });
});
