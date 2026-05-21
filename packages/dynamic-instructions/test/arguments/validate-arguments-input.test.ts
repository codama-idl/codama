import { address } from '@solana/addresses';
import type { InstructionNode } from 'codama';
import {
    argumentValueNode,
    instructionArgumentNode,
    instructionNode,
    instructionRemainingAccountsNode,
    numberTypeNode,
    programNode,
    rootNode,
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
