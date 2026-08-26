import { address } from '@solana/addresses';
import type { InstructionNode } from 'codama';
import {
    argumentValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTypeNode,
    instructionArgumentNode,
    instructionNode,
    instructionRemainingAccountsNode,
    numberTypeNode,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { encodeInstructionArguments } from '../../src/arguments/encode-instruction-arguments';
import { createArgumentsInputValidator } from '../../src/arguments/validate-arguments-input';

const PROGRAM_KEY = '11111111111111111111111111111111';

function makeRoot(ix: InstructionNode, definedTypes: Parameters<typeof programNode>[0]['definedTypes'] = []) {
    return rootNode(programNode({ definedTypes, instructions: [ix], name: 'test', publicKey: PROGRAM_KEY }));
}

describe('Instruction validation: remaining account arguments', () => {
    const ADDR_1 = address('11111111111111111111111111111111');
    const ADDR_2 = address('22222222222222222222222222222222222222222222');

    const multisigIx = instructionNode({
        arguments: [instructionArgumentNode({ name: 'm', type: numberTypeNode('u8') })],
        name: 'initializeMultisig',
        remainingAccounts: [
            instructionRemainingAccountsNode(argumentValueNode('signers'), { isOptional: false, isSigner: false }),
        ],
    });
    const multisigRoot = makeRoot(multisigIx);

    const transferIx = instructionNode({
        arguments: [instructionArgumentNode({ name: 'amount', type: numberTypeNode('u64') })],
        name: 'transfer',
        remainingAccounts: [
            instructionRemainingAccountsNode(argumentValueNode('multiSigners'), { isOptional: true, isSigner: false }),
        ],
    });
    const transferRoot = makeRoot(transferIx);

    test('should not reject remaining account args as extra keys', () => {
        const validate = createArgumentsInputValidator(multisigRoot, multisigIx);
        expect(() => validate({ m: 2, signers: [ADDR_1, ADDR_2] })).not.toThrow();
    });

    test('should still validate regular arguments when remaining account args are present', () => {
        const validate = createArgumentsInputValidator(multisigRoot, multisigIx);
        expect(() => validate({ m: 'invalid', signers: [ADDR_1] })).toThrow('Invalid argument "m"');
    });

    test('should not reject optional remaining account args when omitted', () => {
        const validate = createArgumentsInputValidator(transferRoot, transferIx);
        expect(() => validate({ amount: 100 })).not.toThrow();
    });

    test('should not reject optional remaining account args when provided', () => {
        const validate = createArgumentsInputValidator(transferRoot, transferIx);
        expect(() => validate({ amount: 100, multiSigners: [ADDR_1] })).not.toThrow();
    });

    test('should not encode remaining account args as instruction data', () => {
        const withSigners = encodeInstructionArguments(multisigRoot, multisigIx, {
            m: 2,
            signers: [ADDR_1, ADDR_2],
        });
        const withoutSigners = encodeInstructionArguments(multisigRoot, multisigIx, { m: 2 });

        expect(withSigners).toEqual(withoutSigners);
    });
});

describe('Instruction validation: enum inputs accept the shape the codec decodes', () => {
    const seedEnum = definedTypeNode({
        name: 'seedEnum',
        type: enumTypeNode([
            enumEmptyVariantTypeNode('arm'),
            enumEmptyVariantTypeNode('bar'),
            enumEmptyVariantTypeNode('car'),
        ]),
    });
    const command = definedTypeNode({
        name: 'command',
        type: enumTypeNode([
            enumEmptyVariantTypeNode('quit'),
            enumStructVariantTypeNode(
                'move',
                structTypeNode([structFieldTypeNode({ name: 'x', type: numberTypeNode('u8') })]),
            ),
        ]),
    });
    const enumIx = instructionNode({
        arguments: [
            instructionArgumentNode({ name: 'seedEnum', type: definedTypeLinkNode('seedEnum') }),
            instructionArgumentNode({ name: 'command', type: definedTypeLinkNode('command') }),
        ],
        name: 'nestedExampleIx',
    });
    const enumRoot = makeRoot(enumIx, [seedEnum, command]);
    const validate = createArgumentsInputValidator(enumRoot, enumIx);

    const validSeed = 'arm';
    const validCommand = { __kind: 'quit' };

    test('accepts an empty variant as a PascalCase __kind object', () => {
        expect(() => validate({ command: validCommand, seedEnum: { __kind: 'Arm' } })).not.toThrow();
    });

    test('accepts an empty variant as a PascalCase bare name', () => {
        expect(() => validate({ command: validCommand, seedEnum: 'Arm' })).not.toThrow();
    });

    test('accepts a struct variant as a PascalCase __kind object', () => {
        expect(() => validate({ command: { __kind: 'Move', x: 12 }, seedEnum: validSeed })).not.toThrow();
    });

    test('still accepts the raw camelCase shapes', () => {
        expect(() => validate({ command: { __kind: 'move', x: 12 }, seedEnum: 'arm' })).not.toThrow();
    });

    test('still rejects an invalid payload under a PascalCase __kind', () => {
        expect(() => validate({ command: { __kind: 'Move', x: 'oops' }, seedEnum: validSeed })).toThrow(
            /Enum variant "Move" has invalid/,
        );
    });

    test('still rejects an unknown variant', () => {
        expect(() => validate({ command: validCommand, seedEnum: { __kind: 'Leg' } })).toThrow(
            /Invalid enum variant "Leg"/,
        );
    });
});
