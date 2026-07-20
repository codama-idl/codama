import { CodamaError } from '@codama/errors';
import { getBase16Codec, getU32Encoder, getU64Encoder, mergeBytes } from '@solana/codecs';
import type { InstructionNode } from 'codama';
import {
    bytesTypeNode,
    bytesValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumTypeNode,
    fixedSizeTypeNode,
    instructionArgumentNode,
    instructionNode,
    numberTypeNode,
    numberValueNode,
    optionTypeNode,
    programNode,
    remainderOptionTypeNode,
    rootNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { encodeInstructionArguments } from '../../src/arguments/encode-instruction-arguments';
import { createArgumentsInputValidator } from '../../src/arguments/validate-arguments-input';

const PROGRAM_KEY = '11111111111111111111111111111111';

function makeRoot(ix: InstructionNode, definedTypes: Parameters<typeof programNode>[0]['definedTypes'] = []) {
    return rootNode(programNode({ definedTypes, instructions: [ix], name: 'test', publicKey: PROGRAM_KEY }));
}

const writeIx = instructionNode({
    arguments: [
        instructionArgumentNode({
            defaultValue: numberValueNode(0),
            defaultValueStrategy: 'omitted',
            name: 'discriminator',
            type: numberTypeNode('u8'),
        }),
        instructionArgumentNode({ name: 'offset', type: numberTypeNode('u32') }),
        instructionArgumentNode({ name: 'data', type: remainderOptionTypeNode(bytesTypeNode()) }),
    ],
    name: 'write',
});
const writeRoot = makeRoot(writeIx);

describe('encodeInstructionArguments', () => {
    test('should encode omitted discriminator using default numberValueNode', () => {
        const encoded = encodeInstructionArguments(writeRoot, writeIx, { data: null, offset: 2 });

        // discriminator: u8 + offset: u32
        expect(encoded).toEqual(new Uint8Array([0, 2, 0, 0, 0]));
    });

    test('should encode omitted discriminator using default bytesValueNode', () => {
        const ix = instructionNode({
            arguments: [
                instructionArgumentNode({
                    defaultValue: bytesValueNode('base16', '1f094566b31b79c7'),
                    defaultValueStrategy: 'omitted',
                    name: 'discriminator',
                    type: fixedSizeTypeNode(bytesTypeNode(), 8),
                }),
                instructionArgumentNode({ name: 'input', type: numberTypeNode('u64') }),
                instructionArgumentNode({ name: 'optionalInput', type: optionTypeNode(numberTypeNode('u64')) }),
            ],
            name: 'updateOptionalInput',
        });
        const root = makeRoot(ix);

        const encoded = encodeInstructionArguments(root, ix, { input: 42n, optionalInput: null });

        const expectedDiscriminator = getBase16Codec().encode('1f094566b31b79c7');
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
        const testData = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
        const encoded = encodeInstructionArguments(writeRoot, writeIx, { data: testData, offset: 10 });

        const expected = mergeBytes([new Uint8Array([0]), getU32Encoder().encode(10) as Uint8Array, testData]);
        expect(encoded).toEqual(expected);
    });

    test('should resolve definedTypeLinkNode to enumTypeNode', () => {
        const ix = instructionNode({
            arguments: [instructionArgumentNode({ name: 'encoding', type: definedTypeLinkNode('encoding') })],
            name: 'testEnum',
        });
        const root = makeRoot(ix, [
            definedTypeNode({
                name: 'encoding',
                type: enumTypeNode([
                    enumEmptyVariantTypeNode('none'),
                    enumEmptyVariantTypeNode('utf8'),
                    enumEmptyVariantTypeNode('base64'),
                ]),
            }),
        ]);

        const encoded = encodeInstructionArguments(root, ix, { encoding: 'base64' });

        // base64 is variant index 2
        expect(encoded).toEqual(new Uint8Array([2]));
    });

    test('should throw ARGUMENT_MISSING for missing required argument', () => {
        expect(() => encodeInstructionArguments(writeRoot, writeIx, {})).toThrow(
            'Missing argument [offset] in [write].',
        );
    });

    test('should throw DEFAULT_VALUE_MISSING when omitted argument has no defaultValue', () => {
        const modifiedIx: InstructionNode = {
            ...writeIx,
            arguments: (writeIx.arguments ?? []).map(arg =>
                arg.name === 'discriminator' ? { ...arg, defaultValue: undefined } : arg,
            ),
        };

        expect(() => encodeInstructionArguments(writeRoot, modifiedIx, { data: null, offset: 0 })).toThrow(
            'Default value is missing for argument [discriminator] in [write].',
        );
    });

    test('should throw ValidationError when omitted argument is provided', () => {
        const validate = createArgumentsInputValidator(writeRoot, writeIx);
        expect(() => validate({ data: null, discriminator: 99, offset: 0 })).toThrow(CodamaError);
    });

    test('should encode instruction with only omitted discriminator (no user args)', () => {
        const closeIx = instructionNode({
            arguments: [
                instructionArgumentNode({
                    defaultValue: numberValueNode(6),
                    defaultValueStrategy: 'omitted',
                    name: 'discriminator',
                    type: numberTypeNode('u8'),
                }),
            ],
            name: 'close',
        });
        const root = makeRoot(closeIx);

        const encoded = encodeInstructionArguments(root, closeIx, {});
        expect(encoded).toEqual(new Uint8Array([6]));
    });
});
