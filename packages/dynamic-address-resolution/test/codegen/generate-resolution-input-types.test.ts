import {
    camelCase,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    instructionRemainingAccountsNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { generateResolutionInputTypes } from '../../src/codegen/generate-resolution-input-types';
import { makeRoot } from '../test-utils';

describe('generateResolutionInputTypes', () => {
    test('should generate Args type with correct TS types', () => {
        const root = makeRoot([
            instructionNode({
                arguments: [
                    instructionArgumentNode({
                        name: 'amount',
                        type: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
                    }),
                    instructionArgumentNode({
                        name: 'memo',
                        type: { encoding: 'utf8', kind: 'stringTypeNode' },
                    }),
                ],
                name: 'transfer',
            }),
        ]);
        const output = generateResolutionInputTypes(root);
        expect(output).toContain('export type TransferArgs');
        expect(output).toContain('amount: number | bigint;');
        expect(output).toContain('memo: string;');
    });

    test('should filter omitted arguments from Args type', () => {
        const root = makeRoot([
            instructionNode({
                arguments: [
                    instructionArgumentNode({
                        name: 'visible',
                        type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                    }),
                    instructionArgumentNode({
                        defaultValue: { kind: 'numberValueNode', number: 0 },
                        defaultValueStrategy: 'omitted',
                        name: 'hidden',
                        type: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                    }),
                ],
                name: 'init',
            }),
        ]);
        const output = generateResolutionInputTypes(root);
        expect(output).toContain('visible: number;');
        expect(output).not.toContain('hidden');
    });

    test('should skip Args block when there are no arguments', () => {
        const root = makeRoot([
            instructionNode({
                accounts: [instructionAccountNode({ isSigner: true, isWritable: false, name: 'authority' })],
                name: 'noArgs',
            }),
        ]);
        const output = generateResolutionInputTypes(root);
        expect(output).not.toContain('NoArgsArgs');
    });

    test('should mark auto-resolvable accounts with ? and required ones plain', () => {
        const root = makeRoot([
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        defaultValue: { kind: 'payerValueNode' },
                        isSigner: true,
                        isWritable: true,
                        name: 'payer',
                    }),
                    instructionAccountNode({
                        defaultValue: {
                            kind: 'publicKeyValueNode',
                            publicKey: '11111111111111111111111111111111',
                        },
                        isSigner: false,
                        isWritable: false,
                        name: 'systemProgram',
                    }),
                    instructionAccountNode({ isSigner: false, isWritable: true, name: 'target' }),
                ],
                name: 'create',
            }),
        ]);
        const output = generateResolutionInputTypes(root);
        expect(output).toContain('export type CreateAccounts');
        expect(output).toContain('payer: Address;');
        expect(output).toContain('systemProgram?: Address;');
        expect(output).toContain('target: Address;');
    });

    test('should emit | null for optional accounts', () => {
        const root = makeRoot([
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        isOptional: true,
                        isSigner: false,
                        isWritable: false,
                        name: 'closeAuthority',
                    }),
                ],
                name: 'maybeClose',
            }),
        ]);
        const output = generateResolutionInputTypes(root);
        expect(output).toContain('closeAuthority: Address | null;');
    });

    test('should emit Resolvers type when resolverValueNode exists', () => {
        const root = makeRoot([
            instructionNode({
                accounts: [instructionAccountNode({ isSigner: true, isWritable: false, name: 'authority' })],
                arguments: [
                    instructionArgumentNode({
                        defaultValue: { kind: 'resolverValueNode', name: camelCase('computeValue') },
                        name: 'computedValue',
                        type: { endian: 'le', format: 'u64', kind: 'numberTypeNode' },
                    }),
                ],
                name: 'customResolve',
            }),
        ]);
        const output = generateResolutionInputTypes(root);
        expect(output).toContain('export type CustomResolveResolvers');
        expect(output).toContain('computeValue: ResolverFn<CustomResolveArgs, CustomResolveAccounts>;');
    });

    test('should mark optional type arguments with ?', () => {
        const root = makeRoot([
            instructionNode({
                arguments: [
                    instructionArgumentNode({
                        name: 'maybeValue',
                        type: {
                            item: { endian: 'le', format: 'u32', kind: 'numberTypeNode' },
                            kind: 'optionTypeNode',
                            prefix: { endian: 'le', format: 'u8', kind: 'numberTypeNode' },
                        },
                    }),
                ],
                name: 'optionalArgs',
            }),
        ]);
        const output = generateResolutionInputTypes(root);
        expect(output).toContain('maybeValue?: number | null;');
    });

    test('should emit remaining account arguments in Args type', () => {
        const root = makeRoot([
            instructionNode({
                name: 'multiSig',
                remainingAccounts: [
                    instructionRemainingAccountsNode(
                        { kind: 'argumentValueNode', name: camelCase('multiSigners') },
                        { isSigner: true, isWritable: false },
                    ),
                ],
            }),
        ]);
        const output = generateResolutionInputTypes(root);
        expect(output).toContain('export type MultiSigArgs');
        expect(output).toContain('multiSigners: Address[];');
    });

    test('should emit empty Accounts fallback for instructions without accounts', () => {
        const root = makeRoot([instructionNode({ name: 'noAccounts' })]);
        const output = generateResolutionInputTypes(root);
        expect(output).toContain('export type NoAccountsAccounts = Record<string, never>;');
        expect(output).toContain(
            'export type NoAccountsAccountsWithData = Record<string, Address | null | undefined>;',
        );
    });

    test('should not emit Signers or InstructionBuilders blocks', () => {
        const root = makeRoot([
            instructionNode({
                accounts: [instructionAccountNode({ isSigner: 'either', isWritable: false, name: 'authority' })],
                name: 'transfer',
            }),
        ]);
        const output = generateResolutionInputTypes(root);
        expect(output).not.toContain('TransferSigners');
        expect(output).not.toContain('InstructionBuilders');
    });
});
