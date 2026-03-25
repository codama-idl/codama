import { getNodeCodec, type ReadonlyUint8Array } from '@codama/dynamic-codecs';
import { type Address } from '@solana/addresses';
import { beforeEach, describe, expect, test } from 'vitest';

import type { CollectionTypesProgramClient } from '../generated/collection-types-idl-types';
import { createTestProgramClient, loadRoot, SvmTestContext } from '../test-utils';

const root = loadRoot('collection-types-idl.json');

function decodeInstructionData(instructionName: string, data: ReadonlyUint8Array): unknown {
    const ix = root.program.instructions.find(i => i.name === instructionName);
    if (!ix) throw new Error(`Instruction ${instructionName} not found`);

    const codec = getNodeCodec([root, root.program, ix]);
    return codec.decode(new Uint8Array(data));
}

describe('Collection types: encoding and validation (set, map, tuple)', () => {
    let ctx: SvmTestContext;
    let signer: Address;
    const programClient = createTestProgramClient<CollectionTypesProgramClient>('collection-types-idl.json');

    beforeEach(() => {
        ctx = new SvmTestContext({ defaultPrograms: true, sysvars: true });
        signer = ctx.createFundedAccount();
    });

    describe('tupleTypeNode', () => {
        test('should build instruction with basic tuple [u64, string]', async () => {
            const ix = await programClient.methods
                .storeTuple({ data: [42n, 'hello'] })
                .accounts({ signer })
                .instruction();

            const decoded = decodeInstructionData('storeTuple', ix.data!);
            expect(decoded).toMatchObject({
                data: [42n, 'hello'],
                discriminator: 0,
            });
        });

        test('should build instruction with nested tuple [map, array]', async () => {
            const ix = await programClient.methods
                .storeNestedTuple({
                    data: [{ alice: 100n, bob: 200n }, [1n, 2n, 3n]],
                })
                .accounts({ signer })
                .instruction();

            const decoded = decodeInstructionData('storeNestedTuple', ix.data!);
            expect(decoded).toMatchObject({
                data: [{ alice: 100n, bob: 200n }, [1n, 2n, 3n]],
                discriminator: 6,
            });
        });

        test('should reject tuple with wrong length', async () => {
            await expect(
                programClient.methods
                    // @ts-expect-error - testing wrong tuple length
                    .storeTuple({ data: [42n] })
                    .accounts({ signer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "data\[1\]", value: undefined/);
        });

        test('should reject tuple with wrong item type', async () => {
            await expect(
                programClient.methods
                    // @ts-expect-error - testing wrong item type
                    .storeTuple({ data: [42n, 123] })
                    .accounts({ signer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "data\[1\]", value: 123/);
        });
    });

    describe('mapTypeNode', () => {
        test('should build instruction with basic map ([string]: u64)', async () => {
            const ix = await programClient.methods
                .storeMap({ data: { alice: 100n, bob: 200n, charlie: 300n } })
                .accounts({ signer })
                .instruction();

            const decoded = decodeInstructionData('storeMap', ix.data!);
            expect(decoded).toMatchObject({
                data: { alice: 100n, bob: 200n, charlie: 300n },
                discriminator: 1,
            });
        });

        test('should build instruction with empty map', async () => {
            const ix = await programClient.methods.storeMap({ data: {} }).accounts({ signer }).instruction();

            const decoded = decodeInstructionData('storeMap', ix.data!);
            expect(decoded).toMatchObject({
                data: {},
                discriminator: 1,
            });
        });

        test('should build instruction with nested map ([string]: array<u64>)', async () => {
            const ix = await programClient.methods
                .storeNestedMap({
                    data: {
                        list1: [1n, 2n, 3n],
                        list2: [10n, 20n],
                        list3: [],
                    },
                })
                .accounts({ signer })
                .instruction();

            const decoded = decodeInstructionData('storeNestedMap', ix.data!);
            expect(decoded).toMatchObject({
                data: {
                    list1: [1n, 2n, 3n],
                    list2: [10n, 20n],
                    list3: [],
                },
                discriminator: 7,
            });
        });

        test('should reject non-object input', async () => {
            await expect(
                programClient.methods
                    // @ts-expect-error - testing non-object input
                    .storeMap({ data: [1, 2, 3] })
                    .accounts({ signer })
                    .instruction(),
            ).rejects.toThrow(/Expected a plain object for mapTypeNode, but received: array/);
        });

        test('should reject wrong value type', async () => {
            await expect(
                programClient.methods
                    // @ts-expect-error - testing wrong value type
                    .storeMap({ data: { key: 'wrong' } })
                    .accounts({ signer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "data"/);
        });
    });

    describe('setTypeNode', () => {
        test('should build instruction with basic set<u64>', async () => {
            const ix = await programClient.methods
                .storeSet({ data: [1n, 2n, 3n] })
                .accounts({ signer })
                .instruction();

            const decoded = decodeInstructionData('storeSet', ix.data!);
            expect(decoded).toMatchObject({
                data: [1n, 2n, 3n],
                discriminator: 2,
            });
        });

        test('should build instruction with empty set', async () => {
            const ix = await programClient.methods.storeSet({ data: [] }).accounts({ signer }).instruction();

            const decoded = decodeInstructionData('storeSet', ix.data!);
            expect(decoded).toMatchObject({
                data: [],
                discriminator: 2,
            });
        });

        test('should build instruction with nested set<tuple<u64, string>>', async () => {
            const ix = await programClient.methods
                .storeNestedSet({
                    data: [
                        [1n, 'first'],
                        [2n, 'second'],
                        [3n, 'third'],
                        [3n, 'fifth'],
                    ],
                })
                .accounts({ signer })
                .instruction();

            const decoded = decodeInstructionData('storeNestedSet', ix.data!);
            expect(decoded).toMatchObject({
                data: [
                    [1n, 'first'],
                    [2n, 'second'],
                    [3n, 'third'],
                    [3n, 'fifth'],
                ],
                discriminator: 8,
            });
        });

        test('should reject duplicate primitive values in set', async () => {
            await expect(
                programClient.methods
                    .storeSet({ data: [1n, 2n, 1n] })
                    .accounts({ signer })
                    .instruction(),
            ).rejects.toThrow(/Expected all items to be unique/);
            await expect(
                programClient.methods
                    .storeNestedSet({
                        data: [
                            [1n, 'first'],
                            [2n, 'second'],
                            [1n, 'first'], // duplicate
                        ],
                    })
                    .accounts({ signer })
                    .instruction(),
            ).rejects.toThrow(/Expected all items to be unique/);
        });

        test('should reject non-array input', async () => {
            await expect(
                programClient.methods
                    // @ts-expect-error - testing non-array input
                    .storeSet({ data: { key: 'value' } })
                    .accounts({ signer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "data"/);
        });

        test('should reject non-serializable input with a helpful validation error', async () => {
            const invalidData: Record<string, unknown> = { a: 1n, b: {} };
            invalidData.b = invalidData;

            await expect(
                programClient.methods
                    // @ts-expect-error - testing circular reference input
                    .storeSet({ data: [invalidData, invalidData] })
                    .accounts({ signer })
                    .instruction(),
            ).rejects.toThrow(/Invalid argument "data", value: non-serializable array \(length 2\)/);
        });
    });
});
