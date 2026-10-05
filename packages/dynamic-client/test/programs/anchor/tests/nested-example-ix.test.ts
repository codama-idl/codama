import { getNodeValueCodec } from '@codama/dynamic-codecs';
import { CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA } from '@codama/errors';
import { type Address, getAddressEncoder, getProgramDerivedAddress } from '@solana/addresses';
import { none, some } from '@solana/codecs';
import type { RootNode } from 'codama';
import { beforeEach, describe, expect, test } from 'vitest';

import type { NestedExampleInstructionDataArgs } from '../../generated/example-idl-types';
import { SvmTestContext, valueTypeError } from '../../test-utils';
import { bytesToBase16CodecFormat, createTestContext, programClient } from './helpers';

describe('anchor-example: nestedExampleIx', () => {
    let ctx: SvmTestContext;
    let payer: Address;

    beforeEach(async () => {
        ({ ctx, payer } = await createTestContext());
    });

    test('should encode nested struct with scalar enums, bytes, fixed array, and none inner enum', async () => {
        const pubkeyArg = await ctx.createAccount();
        const nestedExampleAccount = await deriveNestedExamplePda(
            programClient.programAddress,
            pubkeyArg,
            'arm',
            'bar',
        );

        const ix = await programClient.methods
            .nestedExample({
                input: {
                    header: { command: { __kind: 'start', data: [42n] }, version: 1 },
                    innerEnum: { __kind: 'none' },
                    innerStruct: {
                        bytes: new Uint8Array([1, 2, 3]),
                        enumsArray: ['arm', 'car'],
                        name: 'hello',
                        optionalPubkey: null,
                        seedEnum: 'bar',
                        value: BigInt(100),
                    },
                    pubkey: pubkeyArg,
                    seedEnum: 'arm',
                },
            })
            .accounts({ nestedExampleAccount, signer: payer })
            .instruction();

        await ctx.sendInstruction(ix, [payer]);

        expect(ix.data?.length).toBeGreaterThan(0);
        const exampleAccountData = ctx.requireEncodedAccount(nestedExampleAccount).data;

        const exampleAccount = decodeNestedExampleAccount(programClient.root, exampleAccountData);
        expect(exampleAccount.input).toEqual({
            header: { command: { __discriminator: 0, __kind: 'start', data: [42n] }, version: 1n },
            innerEnum: { __discriminator: 2, __kind: 'none' },
            innerStruct: {
                bytes: bytesToBase16CodecFormat(new Uint8Array([1, 2, 3])),
                enumsArray: [seedEnumVariant('arm'), seedEnumVariant('car')],
                name: 'hello',
                optionalPubkey: none(),
                seedEnum: seedEnumVariant('bar'),
                value: 100n,
            },
            pubkey: pubkeyArg,
            seedEnum: seedEnumVariant('arm'),
        });
    });

    test('should encode Command::Continue with reason string [enumStructVariantTypeNode]', async () => {
        const pubkeyArg = await ctx.createAccount();
        const nestedExampleAccount = await deriveNestedExamplePda(
            programClient.programAddress,
            pubkeyArg,
            'bar',
            'arm',
        );

        const ix = await programClient.methods
            .nestedExample({
                input: {
                    header: { command: { __kind: 'continue', data: { reason: 'keep going' } }, version: 2 },
                    innerEnum: { __kind: 'none' },
                    innerStruct: {
                        bytes: new Uint8Array([]),
                        enumsArray: ['bar', 'bar'],
                        name: 'test',
                        optionalPubkey: null,
                        seedEnum: 'arm',
                        value: BigInt(0),
                    },
                    pubkey: pubkeyArg,
                    seedEnum: 'bar',
                },
            })
            .accounts({ nestedExampleAccount, signer: payer })
            .instruction();

        await ctx.sendInstruction(ix, [payer]);
        expect(ix.data?.length).toBeGreaterThan(0);
        const exampleAccountData = ctx.requireEncodedAccount(nestedExampleAccount).data;
        const exampleAccount = decodeNestedExampleAccount(programClient.root, exampleAccountData);

        expect(exampleAccount.input).toEqual({
            header: {
                command: {
                    __discriminator: 2,
                    __kind: 'continue',
                    data: { reason: 'keep going' },
                },
                version: 2n,
            },
            innerEnum: { __discriminator: 2, __kind: 'none' },
            innerStruct: {
                bytes: bytesToBase16CodecFormat(new Uint8Array([])),
                enumsArray: [seedEnumVariant('bar'), seedEnumVariant('bar')],
                name: 'test',
                optionalPubkey: none(),
                seedEnum: seedEnumVariant('arm'),
                value: 0n,
            },
            pubkey: pubkeyArg,
            seedEnum: seedEnumVariant('bar'),
        });
    });

    test('should encode InnerEnum::TokenTransfer [enumStructVariantTypeNode->enumEmptyVariantTypeNode]', async () => {
        const pubkeyArg = await ctx.createAccount();
        const nestedExampleAccount = await deriveNestedExamplePda(
            programClient.programAddress,
            pubkeyArg,
            'car',
            'car',
        );

        const ix = await programClient.methods
            .nestedExample({
                input: {
                    header: { command: { __kind: 'stop' }, version: 1 },
                    innerEnum: { __kind: 'tokenTransfer', data: { amount: BigInt(500), tokenType: { __kind: 'sPL' } } },
                    innerStruct: {
                        bytes: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
                        enumsArray: ['car', 'arm'],
                        name: 'transfer',
                        optionalPubkey: null,
                        seedEnum: 'car',
                        value: BigInt(999),
                    },
                    pubkey: pubkeyArg,
                    seedEnum: 'car',
                },
            })
            .accounts({ nestedExampleAccount, signer: payer })
            .instruction();

        await ctx.sendInstruction(ix, [payer]);
        expect(ix.data?.length).toBeGreaterThan(0);
        const exampleAccountData = ctx.requireEncodedAccount(nestedExampleAccount).data;
        const exampleAccount = decodeNestedExampleAccount(programClient.root, exampleAccountData);

        expect(exampleAccount.input).toEqual({
            header: {
                command: {
                    __discriminator: 1,
                    __kind: 'stop',
                },
                version: 1n,
            },
            innerEnum: {
                __discriminator: 0,
                __kind: 'tokenTransfer',
                data: { amount: 500n, tokenType: { __discriminator: 0, __kind: 'sPL' } },
            },
            innerStruct: {
                bytes: bytesToBase16CodecFormat(new Uint8Array([0xde, 0xad, 0xbe, 0xef])),
                enumsArray: [seedEnumVariant('car'), seedEnumVariant('arm')],
                name: 'transfer',
                optionalPubkey: none(),
                seedEnum: seedEnumVariant('car'),
                value: 999n,
            },
            pubkey: pubkeyArg,
            seedEnum: seedEnumVariant('car'),
        });
    });

    test('should encode InnerEnum::TokenTransfer enum (3 levels deep)', async () => {
        const pubkeyArg = await ctx.createAccount();
        const nestedExampleAccount = await deriveNestedExamplePda(
            programClient.programAddress,
            pubkeyArg,
            'arm',
            'arm',
        );

        const ix = await programClient.methods
            .nestedExample({
                input: {
                    header: { command: { __kind: 'start', data: [42n] }, version: 1 },
                    innerEnum: {
                        __kind: 'tokenTransfer',
                        data: { amount: BigInt(1), tokenType: { __kind: 'nFT', data: { collection: 'DegenApes' } } },
                    },
                    innerStruct: {
                        bytes: new Uint8Array([]),
                        enumsArray: ['arm', 'arm'],
                        name: 'nft-test',
                        optionalPubkey: null,
                        seedEnum: 'arm',
                        value: BigInt(1),
                    },
                    pubkey: pubkeyArg,
                    seedEnum: 'arm',
                },
            })
            .accounts({ nestedExampleAccount, signer: payer })
            .instruction();

        await ctx.sendInstruction(ix, [payer]);
        expect(ix.data?.length).toBeGreaterThan(0);
        const exampleAccountData = ctx.requireEncodedAccount(nestedExampleAccount).data;
        const exampleAccount = decodeNestedExampleAccount(programClient.root, exampleAccountData);

        expect(exampleAccount.input).toEqual({
            header: {
                command: {
                    __discriminator: 0,
                    __kind: 'start',
                    data: [42n],
                },
                version: 1n,
            },
            innerEnum: {
                __discriminator: 0,
                __kind: 'tokenTransfer',
                data: {
                    amount: 1n,
                    tokenType: { __discriminator: 1, __kind: 'nFT', data: { collection: 'DegenApes' } },
                },
            },
            innerStruct: {
                bytes: bytesToBase16CodecFormat(new Uint8Array([])),
                enumsArray: [seedEnumVariant('arm'), seedEnumVariant('arm')],
                name: 'nft-test',
                optionalPubkey: none(),
                seedEnum: seedEnumVariant('arm'),
                value: 1n,
            },
            pubkey: pubkeyArg,
            seedEnum: seedEnumVariant('arm'),
        });
    });

    test('should encode Stake inner enum and optional pubkey (Some)', async () => {
        const pubkeyArg = await ctx.createAccount();
        const optionalPubkey = await ctx.createAccount();
        const nestedExampleAccount = await deriveNestedExamplePda(
            programClient.programAddress,
            pubkeyArg,
            'bar',
            'car',
        );

        const ix = await programClient.methods
            .nestedExample({
                input: {
                    header: { command: { __kind: 'start', data: [321n] }, version: 3 },
                    innerEnum: { __kind: 'stake', data: { duration: BigInt(86400) } },
                    innerStruct: {
                        bytes: new Uint8Array([10, 20]),
                        enumsArray: ['bar', 'car'],
                        name: 'staker',
                        optionalPubkey,
                        seedEnum: 'car',
                        value: BigInt(42),
                    },
                    pubkey: pubkeyArg,
                    seedEnum: 'bar',
                },
            })
            .accounts({ nestedExampleAccount, signer: payer })
            .instruction();

        await ctx.sendInstruction(ix, [payer]);
        expect(ix.data?.length).toBeGreaterThan(0);
        const exampleAccountData = ctx.requireEncodedAccount(nestedExampleAccount).data;
        const exampleAccount = decodeNestedExampleAccount(programClient.root, exampleAccountData);

        expect(exampleAccount.input).toEqual({
            header: {
                command: {
                    __discriminator: 0,
                    __kind: 'start',
                    data: [321n],
                },
                version: 3n,
            },
            innerEnum: {
                __discriminator: 1,
                __kind: 'stake',
                data: { duration: 86400n },
            },
            innerStruct: {
                bytes: bytesToBase16CodecFormat(new Uint8Array([10, 20])),
                enumsArray: [seedEnumVariant('bar'), seedEnumVariant('car')],
                name: 'staker',
                optionalPubkey: some(optionalPubkey),
                seedEnum: seedEnumVariant('car'),
                value: 42n,
            },
            pubkey: pubkeyArg,
            seedEnum: seedEnumVariant('bar'),
        });
    });

    describe('should validate nestedExampleIx arguments', () => {
        let pubkeyArg: Address;
        let nestedExampleAccount: Address;

        beforeEach(async () => {
            pubkeyArg = await ctx.createAccount();
            nestedExampleAccount = await deriveNestedExamplePda(programClient.programAddress, pubkeyArg, 'arm', 'bar');
        });

        const makeValidArgs = (pubkey: Address): NestedExampleInstructionDataArgs['input'] => ({
            header: { command: { __kind: 'start', data: [123n] }, version: 1 },
            innerEnum: { __kind: 'none' },
            innerStruct: {
                bytes: new Uint8Array([1, 2, 3]),
                enumsArray: ['arm', 'car'],
                name: 'hello',
                optionalPubkey: null,
                seedEnum: 'bar',
                value: BigInt(100),
            },
            pubkey,
            seedEnum: 'arm',
        });

        test('should throw when input is missing', async () => {
            // Missing structs encode as empty ones, so their first required field is reported.
            await expect(
                programClient.methods
                    .nestedExample({} as unknown as NestedExampleInstructionDataArgs)
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'command', kind: 'definedTypeNode' },
                    { actualType: 'undefined', nodeKind: 'enumTypeNode' },
                ),
            );
        });

        test('should throw when header is missing', async () => {
            // Missing structs encode as empty ones, so their first required field is reported.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { header: _header, ...args } = makeValidArgs(pubkeyArg);
            await expect(
                programClient.methods
                    .nestedExample({
                        input: args as unknown as NestedExampleInstructionDataArgs['input'],
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'command', kind: 'definedTypeNode' },
                    { actualType: 'undefined', nodeKind: 'enumTypeNode' },
                ),
            );
        });

        test('should throw when command enum fields tuple payload is missing', async () => {
            const input = makeValidArgs(pubkeyArg);
            input.header.command = {
                __kind: 'start',
                data: null,
            } as unknown as NestedExampleInstructionDataArgs['input']['header']['command'];
            await expect(
                programClient.methods
                    .nestedExample({
                        input,
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'command', kind: 'definedTypeNode' },
                    { actualType: 'null', nodeKind: 'tupleTypeNode' },
                ),
            );
        });

        test('should throw when innerEnum payload data is missing', async () => {
            const input = makeValidArgs(pubkeyArg);
            input.innerEnum = {
                __kind: 'tokenTransfer',
                data: { amount: BigInt(1), tokenType: { __kind: 'nFT', data: { collection: 'Test' } } },
            };
            input.innerEnum.data.amount = undefined as unknown as bigint; // Force amount to be missing
            await expect(
                programClient.methods
                    .nestedExample({
                        input,
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'innerEnum', kind: 'definedTypeNode' },
                    { actualType: 'undefined', nodeKind: 'integerTypeNode' },
                ),
            );
        });

        test('should throw when tokenTransfer variant is missing all payload fields', async () => {
            const input = {
                ...makeValidArgs(pubkeyArg),
                innerEnum: {
                    __kind: 'tokenTransfer',
                } as unknown as NestedExampleInstructionDataArgs['input']['innerEnum'],
            };
            await expect(
                programClient.methods
                    .nestedExample({ input })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'innerEnum', kind: 'definedTypeNode' },
                    {
                        actualType: "variant 'tokenTransfer' without data",
                        nodeKind: 'enumVariantTypeNode',
                    },
                ),
            );
        });

        test('should throw when tokenTransfer variant is missing tokenType', async () => {
            const input = {
                ...makeValidArgs(pubkeyArg),
                innerEnum: {
                    __kind: 'tokenTransfer',
                    data: { amount: BigInt(1) },
                } as unknown as NestedExampleInstructionDataArgs['input']['innerEnum'],
            };
            await expect(
                programClient.methods
                    .nestedExample({ input })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'tokenType', kind: 'definedTypeNode' },
                    { actualType: 'undefined', nodeKind: 'enumTypeNode' },
                ),
            );
        });

        test('should throw when continue variant is missing reason', async () => {
            const input = {
                ...makeValidArgs(pubkeyArg),
                header: {
                    command: {
                        __kind: 'continue',
                    } as unknown as NestedExampleInstructionDataArgs['input']['header']['command'],
                    version: 1,
                },
            };
            await expect(
                programClient.methods
                    .nestedExample({ input })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'command', kind: 'definedTypeNode' },
                    {
                        actualType: "variant 'continue' without data",
                        nodeKind: 'enumVariantTypeNode',
                    },
                ),
            );
        });

        test('should throw when innerStruct is missing', async () => {
            // Missing structs encode as empty ones, so their first required field is reported.
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { innerStruct: _innerStruct, ...args } = makeValidArgs(pubkeyArg);
            await expect(
                programClient.methods
                    .nestedExample({
                        input: args as unknown as NestedExampleInstructionDataArgs['input'],
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'innerStruct', kind: 'definedTypeNode' },
                    { actualType: 'undefined', nodeKind: 'stringTypeNode' },
                ),
            );
        });

        test('should throw when pubkey is missing', async () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { pubkey: _pubkey, ...args } = makeValidArgs(pubkeyArg);
            await expect(
                programClient.methods
                    .nestedExample({
                        input: args as unknown as NestedExampleInstructionDataArgs['input'],
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'structAndEnumsInput', kind: 'definedTypeNode' },
                    { actualType: 'undefined', nodeKind: 'publicKeyTypeNode' },
                ),
            );
        });

        test('should throw when header.version is string', async () => {
            const input = {
                ...makeValidArgs(pubkeyArg),
                header: { command: { __kind: 'start' }, version: 'one' as unknown as number },
            } as unknown as NestedExampleInstructionDataArgs['input'];
            await expect(
                programClient.methods
                    .nestedExample({
                        input,
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'innerHeader', kind: 'definedTypeNode' },
                    { actualType: 'string', nodeKind: 'integerTypeNode' },
                ),
            );
        });

        test('should throw when innerStruct.value is string', async () => {
            const validInput = makeValidArgs(pubkeyArg);
            const { innerStruct } = validInput;
            const input = {
                ...validInput,
                innerStruct: {
                    ...innerStruct,
                    value: 'hundred-of-thousands' as unknown as bigint,
                },
            } as unknown as NestedExampleInstructionDataArgs['input'];
            await expect(
                programClient.methods
                    .nestedExample({
                        input,
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'innerStruct', kind: 'definedTypeNode' },
                    { actualType: 'string', nodeKind: 'integerTypeNode' },
                ),
            );
        });

        test('should throw for invalid seedEnum variant', async () => {
            const input = { ...makeValidArgs(pubkeyArg), seedEnum: 'invalidVariant' as unknown as 'arm' };
            await expect(
                programClient.methods
                    .nestedExample({
                        input,
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'seedEnum', kind: 'definedTypeNode' },
                    { actualType: "variant 'invalidVariant'", nodeKind: 'enumTypeNode' },
                ),
            );
        });

        test('should throw for invalid innerEnum __kind', async () => {
            const input = {
                ...makeValidArgs(pubkeyArg),
                innerEnum: {
                    __kind: 'nonExistent',
                } as unknown as NestedExampleInstructionDataArgs['input']['innerEnum'],
            };
            await expect(
                programClient.methods
                    .nestedExample({
                        input,
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'innerEnum', kind: 'definedTypeNode' },
                    { actualType: "variant 'nonExistent'", nodeKind: 'enumTypeNode' },
                ),
            );
        });

        test('should throw for invalid header.command __kind', async () => {
            const input = {
                ...makeValidArgs(pubkeyArg),
                header: {
                    command: {
                        __kind: 'invalidCommand',
                    } as unknown as NestedExampleInstructionDataArgs['input']['header']['command'],
                    version: 1,
                },
            };
            await expect(
                programClient.methods
                    .nestedExample({ input })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'command', kind: 'definedTypeNode' },
                    { actualType: "variant 'invalidCommand'", nodeKind: 'enumTypeNode' },
                ),
            );
        });

        test('should throw when enumsArray has wrong size', async () => {
            const validInput = makeValidArgs(pubkeyArg);
            const { innerStruct } = validInput;
            const input = {
                ...makeValidArgs(pubkeyArg),
                innerStruct: {
                    ...innerStruct,
                    enumsArray: ['arm'] as unknown as ('arm' | 'bar' | 'car')[],
                },
            };
            await expect(
                programClient.methods
                    .nestedExample({
                        input,
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                expect.objectContaining({
                    context: expect.objectContaining({
                        __code: CODAMA_ERROR__DYNAMIC_CLIENT__FAILED_TO_ENCODE_DATA,
                        instructionName: 'nestedExample',
                    }),
                }),
            );
        });

        test('should throw when enumsArray has invalid enum value', async () => {
            const validInput = makeValidArgs(pubkeyArg);
            const { innerStruct } = validInput;
            const input = {
                ...makeValidArgs(pubkeyArg),
                innerStruct: {
                    ...innerStruct,
                    enumsArray: ['arm', 'invalid'] as unknown as ('arm' | 'bar' | 'car')[],
                },
            };
            await expect(
                programClient.methods
                    .nestedExample({
                        input,
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'seedEnum', kind: 'definedTypeNode' },
                    { actualType: "variant 'invalid'", nodeKind: 'enumTypeNode' },
                ),
            );
        });

        test('should throw when bytes is string instead of Uint8Array', async () => {
            const validInput = makeValidArgs(pubkeyArg);
            const { innerStruct } = validInput;
            const input = {
                ...makeValidArgs(pubkeyArg),
                innerStruct: { ...innerStruct, bytes: 'notbytes' as unknown as Uint8Array },
            };
            await expect(
                programClient.methods
                    .nestedExample({
                        input,
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'innerStruct', kind: 'definedTypeNode' },
                    { actualType: 'string', nodeKind: 'bytesTypeNode' },
                ),
            );
        });

        test('should throw for invalid pubkey string', async () => {
            const input = { ...makeValidArgs(pubkeyArg), pubkey: 'not-a-valid-address' as unknown as Address };
            await expect(
                programClient.methods
                    .nestedExample({ input })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(
                valueTypeError(
                    { identifier: 'structAndEnumsInput', kind: 'definedTypeNode' },
                    { actualType: 'string', nodeKind: 'publicKeyTypeNode' },
                ),
            );
        });
    });
});

function decodeNestedExampleAccount(root: RootNode, data: Uint8Array) {
    const accountNode = (root.program.accounts ?? []).find(a => a.identifier === 'nestedExampleAccount');
    if (!accountNode) {
        throw new Error('Could not find account node "nestedExampleAccount" node in IDL');
    }

    const codec = getNodeValueCodec([root, root.program, accountNode], {
        bytesEncoding: 'base16',
    });
    const decoded = codec.decode(Uint8Array.from(data));
    return decoded as { discriminator: unknown; input: unknown };
}

async function deriveNestedExamplePda(
    programAddress: Address,
    pubkey: Address,
    seedEnum: 'arm' | 'bar' | 'car',
    innerSeedEnum: 'arm' | 'bar' | 'car',
): Promise<Address> {
    const index: Record<string, number> = { arm: 0, bar: 1, car: 2 };
    const [pda] = await getProgramDerivedAddress({
        programAddress,
        seeds: [
            'nested_example_account',
            getAddressEncoder().encode(pubkey),
            new Uint8Array([index[seedEnum]]),
            new Uint8Array([index[innerSeedEnum]]),
        ],
    });
    return pda;
}

/** SeedEnum enum is stored as a number. */
export function seedEnumVariant(enumValue: string) {
    const variants = ['arm', 'bar', 'car'];
    if (!variants.includes(enumValue)) {
        throw new Error(`Unknown enum value: ${enumValue}`);
    }
    return { __discriminator: variants.indexOf(enumValue), __kind: enumValue };
}
