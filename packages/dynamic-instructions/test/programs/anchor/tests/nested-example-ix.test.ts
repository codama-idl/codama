import { getNodeCodec } from '@codama/dynamic-codecs';
import { type Address, getAddressEncoder, getProgramDerivedAddress } from '@solana/addresses';
import { none, some } from '@solana/codecs';
import type { RootNode } from 'codama';
import { beforeEach, describe, expect, test } from 'vitest';

import type { NestedExampleArgs } from '../../generated/example-idl-types';
import { SvmTestContext } from '../../test-utils';
import { bytesToBase16CodecFormat, createTestContext, programClient } from './helpers';

describe('anchor-example: nestedExampleIx', () => {
    let ctx: SvmTestContext;
    let payer: Address;

    beforeEach(() => {
        ({ ctx, payer } = createTestContext());
    });

    test('should encode nested struct with scalar enums, bytes, fixed array, and none inner enum', async () => {
        const pubkeyArg = ctx.createAccount();
        const nestedExampleAccount = await deriveNestedExamplePda(
            programClient.programAddress,
            pubkeyArg,
            'arm',
            'bar',
        );

        const ix = await programClient.methods
            .nestedExample({
                input: {
                    header: { command: { __kind: 'start', fields: [42n] }, version: 1 },
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

        ctx.sendInstruction(ix, [payer]);

        expect(ix.data?.length).toBeGreaterThan(0);
        const exampleAccountData = ctx.requireEncodedAccount(nestedExampleAccount).data;

        const exampleAccount = decodeNestedExampleAccount(programClient.root, exampleAccountData);
        expect(exampleAccount.input).toEqual({
            header: { command: { __kind: 'Start', fields: [42n] }, version: 1 },
            innerEnum: { __kind: 'None' },
            innerStruct: {
                bytes: bytesToBase16CodecFormat(new Uint8Array([1, 2, 3])),
                enumsArray: [seedEnumToNumber('arm'), seedEnumToNumber('car')],
                name: 'hello',
                optionalPubkey: none(),
                seedEnum: seedEnumToNumber('bar'),
                value: 100n,
            },
            pubkey: pubkeyArg,
            seedEnum: seedEnumToNumber('arm'),
        });
    });

    test('should encode Command::Continue with reason string [enumStructVariantTypeNode]', async () => {
        const pubkeyArg = ctx.createAccount();
        const nestedExampleAccount = await deriveNestedExamplePda(
            programClient.programAddress,
            pubkeyArg,
            'bar',
            'arm',
        );

        const ix = await programClient.methods
            .nestedExample({
                input: {
                    header: { command: { __kind: 'continue', reason: 'keep going' }, version: 2 },
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

        ctx.sendInstruction(ix, [payer]);
        expect(ix.data?.length).toBeGreaterThan(0);
        const exampleAccountData = ctx.requireEncodedAccount(nestedExampleAccount).data;
        const exampleAccount = decodeNestedExampleAccount(programClient.root, exampleAccountData);

        expect(exampleAccount.input).toEqual({
            header: {
                command: {
                    __kind: 'Continue',
                    reason: 'keep going',
                },
                version: 2,
            },
            innerEnum: { __kind: 'None' },
            innerStruct: {
                bytes: bytesToBase16CodecFormat(new Uint8Array([])),
                enumsArray: [seedEnumToNumber('bar'), seedEnumToNumber('bar')],
                name: 'test',
                optionalPubkey: none(),
                seedEnum: seedEnumToNumber('arm'),
                value: 0n,
            },
            pubkey: pubkeyArg,
            seedEnum: seedEnumToNumber('bar'),
        });
    });

    test('should encode InnerEnum::TokenTransfer [enumStructVariantTypeNode->enumEmptyVariantTypeNode]', async () => {
        const pubkeyArg = ctx.createAccount();
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
                    innerEnum: { __kind: 'tokenTransfer', amount: BigInt(500), tokenType: { __kind: 'sPL' } },
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

        ctx.sendInstruction(ix, [payer]);
        expect(ix.data?.length).toBeGreaterThan(0);
        const exampleAccountData = ctx.requireEncodedAccount(nestedExampleAccount).data;
        const exampleAccount = decodeNestedExampleAccount(programClient.root, exampleAccountData);

        expect(exampleAccount.input).toEqual({
            header: {
                command: {
                    __kind: 'Stop',
                },
                version: 1,
            },
            innerEnum: {
                __kind: 'TokenTransfer',
                amount: 500n,
                tokenType: { __kind: 'SPL' },
            },
            innerStruct: {
                bytes: bytesToBase16CodecFormat(new Uint8Array([0xde, 0xad, 0xbe, 0xef])),
                enumsArray: [seedEnumToNumber('car'), seedEnumToNumber('arm')],
                name: 'transfer',
                optionalPubkey: none(),
                seedEnum: seedEnumToNumber('car'),
                value: 999n,
            },
            pubkey: pubkeyArg,
            seedEnum: seedEnumToNumber('car'),
        });
    });

    test('should encode InnerEnum::TokenTransfer enum (3 levels deep)', async () => {
        const pubkeyArg = ctx.createAccount();
        const nestedExampleAccount = await deriveNestedExamplePda(
            programClient.programAddress,
            pubkeyArg,
            'arm',
            'arm',
        );

        const ix = await programClient.methods
            .nestedExample({
                input: {
                    header: { command: { __kind: 'start', fields: [42n] }, version: 1 },
                    innerEnum: {
                        __kind: 'tokenTransfer',
                        amount: BigInt(1),
                        tokenType: { __kind: 'nFT', collection: 'DegenApes' },
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

        ctx.sendInstruction(ix, [payer]);
        expect(ix.data?.length).toBeGreaterThan(0);
        const exampleAccountData = ctx.requireEncodedAccount(nestedExampleAccount).data;
        const exampleAccount = decodeNestedExampleAccount(programClient.root, exampleAccountData);

        expect(exampleAccount.input).toEqual({
            header: {
                command: {
                    __kind: 'Start',
                    fields: [42n],
                },
                version: 1,
            },
            innerEnum: {
                __kind: 'TokenTransfer',
                amount: 1n,
                tokenType: { __kind: 'NFT', collection: 'DegenApes' },
            },
            innerStruct: {
                bytes: bytesToBase16CodecFormat(new Uint8Array([])),
                enumsArray: [seedEnumToNumber('arm'), seedEnumToNumber('arm')],
                name: 'nft-test',
                optionalPubkey: none(),
                seedEnum: seedEnumToNumber('arm'),
                value: 1n,
            },
            pubkey: pubkeyArg,
            seedEnum: seedEnumToNumber('arm'),
        });
    });

    test('should encode Stake inner enum and optional pubkey (Some)', async () => {
        const pubkeyArg = ctx.createAccount();
        const optionalPubkey = ctx.createAccount();
        const nestedExampleAccount = await deriveNestedExamplePda(
            programClient.programAddress,
            pubkeyArg,
            'bar',
            'car',
        );

        const ix = await programClient.methods
            .nestedExample({
                input: {
                    header: { command: { __kind: 'start', fields: [321n] }, version: 3 },
                    innerEnum: { __kind: 'stake', duration: BigInt(86400) },
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

        ctx.sendInstruction(ix, [payer]);
        expect(ix.data?.length).toBeGreaterThan(0);
        const exampleAccountData = ctx.requireEncodedAccount(nestedExampleAccount).data;
        const exampleAccount = decodeNestedExampleAccount(programClient.root, exampleAccountData);

        expect(exampleAccount.input).toEqual({
            header: {
                command: {
                    __kind: 'Start',
                    fields: [321n],
                },
                version: 3,
            },
            innerEnum: {
                __kind: 'Stake',
                duration: 86400n,
            },
            innerStruct: {
                bytes: bytesToBase16CodecFormat(new Uint8Array([10, 20])),
                enumsArray: [seedEnumToNumber('bar'), seedEnumToNumber('car')],
                name: 'staker',
                optionalPubkey: some(optionalPubkey),
                seedEnum: seedEnumToNumber('car'),
                value: 42n,
            },
            pubkey: pubkeyArg,
            seedEnum: seedEnumToNumber('bar'),
        });
    });

    describe('should validate nestedExampleIx arguments', () => {
        let pubkeyArg: Address;
        let nestedExampleAccount: Address;

        beforeEach(async () => {
            pubkeyArg = ctx.createAccount();
            nestedExampleAccount = await deriveNestedExamplePda(programClient.programAddress, pubkeyArg, 'arm', 'bar');
        });

        const makeValidArgs = (pubkey: Address): NestedExampleArgs['input'] => ({
            header: { command: { __kind: 'start', fields: [123n] }, version: 1 },
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
            await expect(
                programClient.methods
                    .nestedExample({} as unknown as NestedExampleArgs)
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "input"/);
        });

        test('should throw when header is missing', async () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { header: _header, ...args } = makeValidArgs(pubkeyArg);
            await expect(
                programClient.methods
                    .nestedExample({
                        input: args as unknown as NestedExampleArgs['input'],
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "input.header"/);
        });

        test('should throw when command enum fields tuple payload is missing', async () => {
            const input = makeValidArgs(pubkeyArg);
            input.header.command = {
                __kind: 'start',
                fields: null,
            } as unknown as NestedExampleArgs['input']['header']['command'];
            await expect(
                programClient.methods
                    .nestedExample({
                        input,
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "input.header.command"/);
        });

        test('should throw when innerEnum payload data is missing', async () => {
            const input = makeValidArgs(pubkeyArg);
            input.innerEnum = {
                __kind: 'tokenTransfer',
                amount: BigInt(1),
                tokenType: { __kind: 'nFT', collection: 'Test' },
            };
            input.innerEnum.amount = undefined as unknown as bigint; // Force amount to be missing
            await expect(
                programClient.methods
                    .nestedExample({
                        input,
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(/Enum variant "tokenTransfer" has invalid "amount"/);
        });

        test('should throw when tokenTransfer variant is missing all payload fields', async () => {
            const input = {
                ...makeValidArgs(pubkeyArg),
                innerEnum: { __kind: 'tokenTransfer' } as unknown as NestedExampleArgs['input']['innerEnum'],
            };
            await expect(
                programClient.methods
                    .nestedExample({ input })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(/Enum variant "tokenTransfer" has invalid "amount"/);
        });

        test('should throw when tokenTransfer variant is missing tokenType', async () => {
            const input = {
                ...makeValidArgs(pubkeyArg),
                innerEnum: {
                    __kind: 'tokenTransfer',
                    amount: BigInt(1),
                } as unknown as NestedExampleArgs['input']['innerEnum'],
            };
            await expect(
                programClient.methods
                    .nestedExample({ input })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(/Enum variant "tokenTransfer" has invalid "tokenType"/);
        });

        test('should throw when continue variant is missing reason', async () => {
            const input = {
                ...makeValidArgs(pubkeyArg),
                header: {
                    command: { __kind: 'continue' } as unknown as NestedExampleArgs['input']['header']['command'],
                    version: 1,
                },
            };
            await expect(
                programClient.methods
                    .nestedExample({ input })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "input.header.command".*"reason"/);
        });

        test('should throw when innerStruct is missing', async () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { innerStruct: _innerStruct, ...args } = makeValidArgs(pubkeyArg);
            await expect(
                programClient.methods
                    .nestedExample({
                        input: args as unknown as NestedExampleArgs['input'],
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "input.innerStruct"/);
        });

        test('should throw when pubkey is missing', async () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { pubkey: _pubkey, ...args } = makeValidArgs(pubkeyArg);
            await expect(
                programClient.methods
                    .nestedExample({
                        input: args as unknown as NestedExampleArgs['input'],
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "input.pubkey"/);
        });

        test('should throw when header.version is string', async () => {
            const input = {
                ...makeValidArgs(pubkeyArg),
                header: { command: { __kind: 'start' }, version: 'one' as unknown as number },
            } as unknown as NestedExampleArgs['input'];
            await expect(
                programClient.methods
                    .nestedExample({
                        input,
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "input.header.version"/);
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
            } as unknown as NestedExampleArgs['input'];
            await expect(
                programClient.methods
                    .nestedExample({
                        input,
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "input.innerStruct.value"/);
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
            ).rejects.toThrow(/Invalid argument "input.seedEnum"/);
        });

        test('should throw for invalid innerEnum __kind', async () => {
            const input = {
                ...makeValidArgs(pubkeyArg),
                innerEnum: { __kind: 'nonExistent' } as unknown as NestedExampleArgs['input']['innerEnum'],
            };
            await expect(
                programClient.methods
                    .nestedExample({
                        input,
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "input.innerEnum"/);
        });

        test('should throw for invalid header.command __kind', async () => {
            const input = {
                ...makeValidArgs(pubkeyArg),
                header: {
                    command: { __kind: 'invalidCommand' } as unknown as NestedExampleArgs['input']['header']['command'],
                    version: 1,
                },
            };
            await expect(
                programClient.methods
                    .nestedExample({ input })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "input.header.command"/);
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
            ).rejects.toThrow(/Invalid argument "input.innerStruct.enumsArray/);
        });

        test('should throw when enumsArray has invalid enum value', async () => {
            const validInput = makeValidArgs(pubkeyArg);
            const { innerStruct } = validInput;
            const input = {
                ...makeValidArgs(pubkeyArg),
                innerStruct: {
                    ...innerStruct,
                    enumsArray: ['arm', 'invalid', 123] as unknown as ('arm' | 'bar' | 'car')[],
                },
            };
            await expect(
                programClient.methods
                    .nestedExample({
                        input,
                    })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "input.innerStruct.enumsArray/);
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
            ).rejects.toThrow(/Invalid argument "input.innerStruct.bytes"/);
        });

        test('should throw for invalid pubkey string', async () => {
            const input = { ...makeValidArgs(pubkeyArg), pubkey: 'not-a-valid-address' as unknown as Address };
            await expect(
                programClient.methods
                    .nestedExample({ input })
                    .accounts({ nestedExampleAccount, signer: payer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "input.pubkey"/);
        });
    });
});

function decodeNestedExampleAccount(root: RootNode, data: Uint8Array) {
    const accountNode = root.program.accounts.find(a => a.name === 'nestedExampleAccount');
    if (!accountNode) {
        throw new Error('Could not find account node "nestedExampleAccount" node in IDL');
    }

    const codec = getNodeCodec([root, root.program, accountNode], {
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
export function seedEnumToNumber(enumValue: string) {
    switch (enumValue.toLowerCase()) {
        case 'arm':
            return 0;
        case 'bar':
            return 1;
        case 'car':
            return 2;
        default:
            throw new Error(`Unknown enum value: ${enumValue}`);
    }
}
