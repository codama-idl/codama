import { getNodeValueCodec } from '@codama/dynamic-codecs';
import {
    CODAMA_ERROR__CANNOT_RESOLVE_PATH,
    CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY,
    CODAMA_ERROR__DYNAMIC_CLIENT__DATA_MISSING,
    CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION,
    CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE,
    CODAMA_ERROR__LINKED_NODE_NOT_FOUND,
    CodamaError,
} from '@codama/errors';
import type { EncodedAccount } from '@solana/accounts';
import { type Address, getAddressEncoder } from '@solana/addresses';
import type { ReadonlyUint8Array } from '@solana/codecs';
import { SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT, SolanaError } from '@solana/kit';
import {
    accountDataValueNode,
    accountLinkNode,
    accountNode,
    accountValueNode,
    dataValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    injectedValueNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    LinkableDictionary,
    pdaLinkNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    programNode,
    providedNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
    variablePdaSeedNode,
} from 'codama';
import { describe, expect, test, vi } from 'vitest';

import {
    type FetchAccountsFn,
    resolveInstructionAccountAddress,
    resolveInstructionDataDefaultValues,
    resolveStandalonePda,
} from '../../src';
import { account, generateAddress, PROGRAM_ADDRESS } from '../test-utils';

const MINT_ADDRESS = 'So11111111111111111111111111111111111111112' as Address;
const OTHER_ADDRESS = 'SysvarRent111111111111111111111111111111111' as Address;

// A mint account holding its authority and decimals, and a token account linking to its mint.
const mint = accountNode({
    data: structTypeNode([
        structFieldTypeNode({ identifier: 'mintAuthority', type: publicKeyTypeNode() }),
        structFieldTypeNode({ identifier: 'decimals', type: integerTypeNode('u8') }),
    ]),
    identifier: 'mint',
});
const token = accountNode({
    data: structTypeNode([
        structFieldTypeNode({ identifier: 'mint', type: publicKeyTypeNode({ accountLink: accountLinkNode('mint') }) }),
    ]),
    identifier: 'token',
});
const mintAccount = (input = {}) => account('mint', { accountLink: accountLinkNode('mint'), ...input });

/** The path of the last account of a single instruction, within a program defining the mint and token accounts. */
function getPath(instructionInput: Partial<Parameters<typeof instructionNode>[0]>) {
    const instruction = instructionNode({ identifier: 'testInstruction', ...instructionInput });
    const root = rootNode(
        programNode({
            accounts: [mint, token],
            identifier: 'testProgram',
            instructions: [instruction],
            pdas: [pdaNode({ identifier: 'vault', seeds: [variablePdaSeedNode('authority', publicKeyTypeNode())] })],
            publicKey: PROGRAM_ADDRESS,
        }),
    );
    return { instructionPath: [root, root.program, instruction] as const, root };
}

function getAccountPath(instructionInput: Partial<Parameters<typeof instructionNode>[0]>) {
    const { instructionPath, root } = getPath(instructionInput);
    const instruction = instructionPath[2];
    const target = (instruction.accounts ?? [])[(instruction.accounts ?? []).length - 1];
    return { path: [...instructionPath, target] as const, root };
}

function encodeAccount(
    root: ReturnType<typeof rootNode>,
    accountName: 'mint' | 'token',
    address: Address,
    value: unknown,
): EncodedAccount {
    const node = accountName === 'mint' ? mint : token;
    const data = getNodeValueCodec([root, root.program, node]).encode(value);
    return encodedAccount(address, data);
}

function encodedAccount(address: Address, data: ReadonlyUint8Array): EncodedAccount {
    return {
        address,
        data: data as Uint8Array,
        executable: false,
        lamports: 0n as EncodedAccount['lamports'],
        programAddress: PROGRAM_ADDRESS,
        space: BigInt(data.length),
    };
}

/** A `fetchAccounts` function returning the given accounts, which rejects other addresses. */
function getFetchAccounts(accounts: EncodedAccount[]) {
    return vi.fn<FetchAccountsFn>(addresses => {
        const fetched = addresses.map(address => accounts.find(account => account.address === address));
        return fetched.every(account => account !== undefined)
            ? Promise.resolve(fetched)
            : Promise.reject(new Error('Unexpected fetched address'));
    });
}

/** Expect the promise to reject with a Codama error with exactly the given context. */
async function expectCodamaError(promise: Promise<unknown>, expected: CodamaError): Promise<void> {
    await expect(promise).rejects.toThrow(expect.objectContaining({ context: expected.context }));
}

describe('account data values', () => {
    test('it resolves account defaults from the data of fetched accounts', async () => {
        // Given an owner defaulting to the authority of the provided mint.
        const authority = await generateAddress();
        const owner = account('owner', { defaultValue: accountDataValueNode('mint', { path: 'mintAuthority' }) });
        const { path, root } = getAccountPath({ accounts: [mintAccount(), owner] });
        const fetchAccounts = getFetchAccounts([
            encodeAccount(root, 'mint', MINT_ADDRESS, { decimals: 6, mintAuthority: authority }),
        ]);

        // Then it fetches the mint and reads its authority.
        const address = await resolveInstructionAccountAddress({
            accountsInput: { mint: MINT_ADDRESS },
            fetchAccounts,
            path,
        });
        expect(address).toBe(authority);
    });

    test('it resolves the account it reads from its own default value', async () => {
        const authority = await generateAddress();
        const owner = account('owner', { defaultValue: accountDataValueNode('mint', { path: 'mintAuthority' }) });
        const { path, root } = getAccountPath({
            accounts: [mintAccount({ defaultValue: publicKeyValueNode(MINT_ADDRESS) }), owner],
        });
        const fetchAccounts = getFetchAccounts([
            encodeAccount(root, 'mint', MINT_ADDRESS, { decimals: 6, mintAuthority: authority }),
        ]);
        expect(await resolveInstructionAccountAddress({ fetchAccounts, path })).toBe(authority);
    });

    test('it reads the whole account data without a path', async () => {
        // Given an account whose data is a single public key.
        const pointer = accountNode({ data: publicKeyTypeNode(), identifier: 'pointer' });
        const pointerAccount = account('pointer', { accountLink: accountLinkNode('pointer') });
        const target = account('target', { defaultValue: accountDataValueNode('pointer') });
        const instruction = instructionNode({ accounts: [pointerAccount, target], identifier: 'testInstruction' });
        const root = rootNode(
            programNode({
                accounts: [pointer],
                identifier: 'p',
                instructions: [instruction],
                publicKey: PROGRAM_ADDRESS,
            }),
        );
        const data = getNodeValueCodec([root, root.program, pointer]).encode(OTHER_ADDRESS);
        const fetchAccounts = getFetchAccounts([encodedAccount(MINT_ADDRESS, data)]);

        // Then the account resolves to that public key.
        const address = await resolveInstructionAccountAddress({
            accountsInput: { pointer: MINT_ADDRESS },
            fetchAccounts,
            path: [root, root.program, instruction, target],
        });
        expect(address).toBe(OTHER_ADDRESS);
    });

    test('it follows account links within account data', async () => {
        // Given an owner defaulting to the authority of the mint of the provided token.
        const authority = await generateAddress();
        const tokenAddress = await generateAddress();
        const tokenAccount = account('token', { accountLink: accountLinkNode('token') });
        const owner = account('owner', {
            defaultValue: accountDataValueNode('token', { path: 'mint.data.mintAuthority' }),
        });
        const { path, root } = getAccountPath({ accounts: [tokenAccount, owner] });
        const fetchAccounts = getFetchAccounts([
            encodeAccount(root, 'token', tokenAddress, { mint: MINT_ADDRESS }),
            encodeAccount(root, 'mint', MINT_ADDRESS, { decimals: 6, mintAuthority: authority }),
        ]);

        // Then it fetches the token, then its mint.
        const address = await resolveInstructionAccountAddress({
            accountsInput: { token: tokenAddress },
            fetchAccounts,
            path,
        });
        expect(address).toBe(authority);
    });

    test('it reads decoded account data without using default values', async () => {
        // Given a mint whose omitted decimals default to 9.
        const authority = await generateAddress();
        const defaultedMint = accountNode({
            data: structTypeNode([
                structFieldTypeNode({ identifier: 'mintAuthority', type: publicKeyTypeNode() }),
                structFieldTypeNode({
                    defaultValue: integerValueNode('9'),
                    defaultValueStrategy: 'omitted',
                    identifier: 'decimals',
                    type: integerTypeNode('u8'),
                }),
            ]),
            identifier: 'mint',
        });
        const seed = pdaSeedValueNode('authority', injectedValueNode({ key: 'decimals' }));
        const vault = pdaNode({
            identifier: 'vault',
            seeds: [variablePdaSeedNode('authority', integerTypeNode('u8'))],
        });
        const target = account('vault', { defaultValue: pdaValueNode(pdaLinkNode('vault'), { seeds: [seed] }) });
        const instruction = instructionNode({
            accounts: [mintAccount(), target],
            identifier: 'testInstruction',
            provides: [providedNode('decimals', accountDataValueNode('mint', { path: 'decimals' }))],
        });
        const root = rootNode(
            programNode({
                accounts: [defaultedMint],
                identifier: 'p',
                instructions: [instruction],
                pdas: [vault],
                publicKey: PROGRAM_ADDRESS,
            }),
        );
        // These bytes hold 6 decimals, which encoding the omitted field would never produce.
        const data = new Uint8Array([
            ...getNodeValueCodec([root, root.program, defaultedMint]).encode({ mintAuthority: authority }).slice(0, 32),
            6,
        ]);
        const fetchAccounts = getFetchAccounts([encodedAccount(MINT_ADDRESS, data)]);

        // Then the seed uses the decoded decimals.
        const address = await resolveInstructionAccountAddress({
            accountsInput: { mint: MINT_ADDRESS },
            fetchAccounts,
            path: [root, root.program, instruction, target],
        });
        const [expected] = await resolveStandalonePda({
            path: [root, root.program, vault],
            seedsInput: { authority: 6 },
        });
        expect(address).toBe(expected);
    });

    test('it throws when the account is unknown', async () => {
        const owner = account('owner', { defaultValue: accountDataValueNode('unknown', { path: 'mintAuthority' }) });
        const { path } = getAccountPath({ accounts: [owner] });
        await expectCodamaError(
            resolveInstructionAccountAddress({ fetchAccounts: getFetchAccounts([]), path }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__NODE_REFERENCE_NOT_FOUND, {
                path: path.slice(0, 3),
                referencedName: accountDataValueNode('unknown').account,
            }),
        );
    });

    test('it throws when the account has no account link', async () => {
        const owner = account('owner', { defaultValue: accountDataValueNode('mint', { path: 'mintAuthority' }) });
        const { path } = getAccountPath({ accounts: [account('mint'), owner] });
        await expect(
            resolveInstructionAccountAddress({
                accountsInput: { mint: MINT_ADDRESS },
                fetchAccounts: getFetchAccounts([]),
                path,
            }),
        ).rejects.toThrow(
            expect.objectContaining({
                context: expect.objectContaining({ __code: CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION }),
            }),
        );
    });

    test('it throws when the account is omitted', async () => {
        const owner = account('owner', { defaultValue: accountDataValueNode('mint', { path: 'mintAuthority' }) });
        const { path } = getAccountPath({
            accounts: [mintAccount({ isOptional: true }), owner],
            optionalAccountStrategy: 'omitted',
        });
        await expectCodamaError(
            resolveInstructionAccountAddress({
                accountsInput: { mint: null },
                fetchAccounts: getFetchAccounts([]),
                path,
            }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__ACCOUNT_MISSING, {
                path: [...path.slice(0, 3), path[2].accounts![0]],
            }),
        );
    });

    test('it throws when the account data cannot be decoded', async () => {
        const owner = account('owner', { defaultValue: accountDataValueNode('mint', { path: 'mintAuthority' }) });
        const { path } = getAccountPath({ accounts: [mintAccount(), owner] });
        await expect(
            resolveInstructionAccountAddress({
                accountsInput: { mint: MINT_ADDRESS },
                fetchAccounts: getFetchAccounts([encodedAccount(MINT_ADDRESS, new Uint8Array([1, 2]))]),
                path,
            }),
        ).rejects.toThrow(new SolanaError(SOLANA_ERROR__ACCOUNTS__FAILED_TO_DECODE_ACCOUNT, { address: MINT_ADDRESS }));
    });

    test('it throws on circular dependencies through account data', async () => {
        // Given a mint defaulting to an address read from its own data.
        const self = mintAccount({ defaultValue: accountDataValueNode('mint', { path: 'mintAuthority' }) });
        const { path } = getAccountPath({ accounts: [self] });
        await expectCodamaError(
            resolveInstructionAccountAddress({ fetchAccounts: getFetchAccounts([]), path }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY, { chain: 'mint -> mint' }),
        );
    });
});

describe('data values crossing account links', () => {
    const data = structTypeNode([
        structFieldTypeNode({ identifier: 'mint', type: publicKeyTypeNode({ accountLink: accountLinkNode('mint') }) }),
    ]);

    test('it reads the data of linked accounts', async () => {
        const authority = await generateAddress();
        const owner = account('owner', { defaultValue: dataValueNode('mint.data.mintAuthority') });
        const { path, root } = getAccountPath({ accounts: [owner], data });
        const fetchAccounts = getFetchAccounts([
            encodeAccount(root, 'mint', MINT_ADDRESS, { decimals: 6, mintAuthority: authority }),
        ]);
        const address = await resolveInstructionAccountAddress({
            dataInput: { mint: MINT_ADDRESS },
            fetchAccounts,
            path,
        });

        expect(address).toBe(authority);
    });

    test('it reads the whole data of linked accounts with a data segment', async () => {
        // Given an account whose data is a single address.
        const pointer = accountNode({ data: publicKeyTypeNode(), identifier: 'pointer' });
        const pointerData = structTypeNode([
            structFieldTypeNode({
                identifier: 'pointer',
                type: publicKeyTypeNode({ accountLink: accountLinkNode('pointer') }),
            }),
        ]);
        const target = account('target', { defaultValue: dataValueNode('pointer.data') });
        const instruction = instructionNode({
            accounts: [target],
            data: pointerData,
            identifier: 'testInstruction',
        });
        const root = rootNode(
            programNode({
                accounts: [pointer],
                identifier: 'p',
                instructions: [instruction],
                publicKey: PROGRAM_ADDRESS,
            }),
        );
        const fetchAccounts = getFetchAccounts([
            encodedAccount(MINT_ADDRESS, getAddressEncoder().encode(OTHER_ADDRESS)),
        ]);

        // Then the account resolves to that address.
        const address = await resolveInstructionAccountAddress({
            dataInput: { pointer: MINT_ADDRESS },
            fetchAccounts,
            path: [root, root.program, instruction, target],
        });
        expect(address).toBe(OTHER_ADDRESS);
    });

    test('it crosses account links from data that is itself a linked address', async () => {
        // Given a pointer account whose data is the address of a mint.
        const authority = await generateAddress();
        const pointer = accountNode({
            data: publicKeyTypeNode({ accountLink: accountLinkNode('mint') }),
            identifier: 'pointer',
        });
        const pointerData = structTypeNode([
            structFieldTypeNode({
                identifier: 'pointer',
                type: publicKeyTypeNode({ accountLink: accountLinkNode('pointer') }),
            }),
        ]);
        const owner = account('owner', { defaultValue: dataValueNode('pointer.data.data.mintAuthority') });
        const instruction = instructionNode({ accounts: [owner], data: pointerData, identifier: 'testInstruction' });
        const root = rootNode(
            programNode({
                accounts: [pointer, mint],
                identifier: 'p',
                instructions: [instruction],
                publicKey: PROGRAM_ADDRESS,
            }),
        );
        const fetchAccounts = getFetchAccounts([
            encodedAccount(OTHER_ADDRESS, getAddressEncoder().encode(MINT_ADDRESS)),
            encodeAccount(root, 'mint', MINT_ADDRESS, { decimals: 6, mintAuthority: authority }),
        ]);

        // Then both links are crossed.
        const address = await resolveInstructionAccountAddress({
            dataInput: { pointer: OTHER_ADDRESS },
            fetchAccounts,
            path: [root, root.program, instruction, owner],
        });
        expect(address).toBe(authority);
    });

    test('it does not cross account links without a data segment', async () => {
        const fetchAccounts = getFetchAccounts([]);
        const owner = account('owner', { defaultValue: dataValueNode('mint.mintAuthority') });
        const { path } = getAccountPath({ accounts: [owner], data });
        await expect(
            resolveInstructionAccountAddress({ dataInput: { mint: MINT_ADDRESS }, fetchAccounts, path }),
        ).rejects.toThrow(
            expect.objectContaining({
                context: expect.objectContaining({
                    __code: CODAMA_ERROR__CANNOT_RESOLVE_PATH,
                    segment: 'mintAuthority',
                }),
            }),
        );
        expect(fetchAccounts).not.toHaveBeenCalled();
    });

    test('it reads the decoded data of linked accounts without using default values', async () => {
        // Given a mint whose omitted authority defaults to another address.
        const authority = await generateAddress();
        const defaultedMint = accountNode({
            data: structTypeNode([
                structFieldTypeNode({
                    defaultValue: publicKeyValueNode(OTHER_ADDRESS),
                    defaultValueStrategy: 'omitted',
                    identifier: 'mintAuthority',
                    type: publicKeyTypeNode(),
                }),
            ]),
            identifier: 'mint',
        });
        const owner = account('owner', { defaultValue: dataValueNode('mint.data.mintAuthority') });
        const instruction = instructionNode({ accounts: [owner], data, identifier: 'testInstruction' });
        const root = rootNode(
            programNode({
                accounts: [defaultedMint],
                identifier: 'p',
                instructions: [instruction],
                publicKey: PROGRAM_ADDRESS,
            }),
        );
        const fetchAccounts = getFetchAccounts([encodedAccount(MINT_ADDRESS, getAddressEncoder().encode(authority))]);

        // Then it reads the decoded authority.
        const address = await resolveInstructionAccountAddress({
            dataInput: { mint: MINT_ADDRESS },
            fetchAccounts,
            path: [root, root.program, instruction, owner],
        });
        expect(address).toBe(authority);
    });

    test('it treats the value as missing when the linked public key is missing', async () => {
        const fetchAccounts = getFetchAccounts([]);
        const owner = account('owner', { defaultValue: dataValueNode('mint.data.mintAuthority') });
        const { path } = getAccountPath({ accounts: [owner], data });
        await expectCodamaError(
            resolveInstructionAccountAddress({ dataInput: {}, fetchAccounts, path }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__DATA_MISSING, {
                path: path.slice(0, 3),
                pathString: dataValueNode('mint.data.mintAuthority').path,
            }),
        );
        expect(fetchAccounts).not.toHaveBeenCalled();
    });

    test('it derives PDA seeds from the data of linked accounts', async () => {
        const authority = await generateAddress();
        const seed = pdaSeedValueNode('authority', dataValueNode('mint.data.mintAuthority'));
        const vault = account('vault', { defaultValue: pdaValueNode(pdaLinkNode('vault'), { seeds: [seed] }) });
        const { path, root } = getAccountPath({ accounts: [vault], data });
        const fetchAccounts = getFetchAccounts([
            encodeAccount(root, 'mint', MINT_ADDRESS, { decimals: 6, mintAuthority: authority }),
        ]);
        const address = await resolveInstructionAccountAddress({
            dataInput: { mint: MINT_ADDRESS },
            fetchAccounts,
            path,
        });
        const [expected] = await resolveStandalonePda({
            path: [root, root.program, root.program.pdas![0]],
            seedsInput: { authority },
        });
        expect(address).toBe(expected);
    });
});

describe('data defaults injected from account data', () => {
    // Data whose `authority` defaults to the authority of the mint.
    const data = structTypeNode([
        structFieldTypeNode({
            defaultValue: injectedValueNode({ key: 'authority' }),
            identifier: 'authority',
            type: publicKeyTypeNode(),
        }),
    ]);
    const provides = [providedNode('authority', accountDataValueNode('mint', { path: 'mintAuthority' }))];

    test('it reads data values defaulting to account data', async () => {
        const authority = await generateAddress();
        const owner = account('owner', { defaultValue: dataValueNode('authority') });
        const { path, root } = getAccountPath({ accounts: [mintAccount(), owner], data, provides });
        const fetchAccounts = getFetchAccounts([
            encodeAccount(root, 'mint', MINT_ADDRESS, { decimals: 6, mintAuthority: authority }),
        ]);
        const address = await resolveInstructionAccountAddress({
            accountsInput: { mint: MINT_ADDRESS },
            dataInput: {},
            fetchAccounts,
            path,
        });
        expect(address).toBe(authority);
    });

    test('it derives PDA seeds injected from account data', async () => {
        const authority = await generateAddress();
        const seed = pdaSeedValueNode('authority', injectedValueNode({ key: 'authority' }));
        const vault = account('vault', { defaultValue: pdaValueNode(pdaLinkNode('vault'), { seeds: [seed] }) });
        const { path, root } = getAccountPath({ accounts: [mintAccount(), vault], provides });
        const fetchAccounts = getFetchAccounts([
            encodeAccount(root, 'mint', MINT_ADDRESS, { decimals: 6, mintAuthority: authority }),
        ]);
        const address = await resolveInstructionAccountAddress({
            accountsInput: { mint: MINT_ADDRESS },
            fetchAccounts,
            path,
        });
        const [expected] = await resolveStandalonePda({
            path: [root, root.program, root.program.pdas![0]],
            seedsInput: { authority },
        });
        expect(address).toBe(expected);
    });

    test('it throws on circular dependencies between data and accounts', async () => {
        // Given a mint defaulting to the authority, which defaults to the authority of the mint.
        const self = mintAccount({ defaultValue: dataValueNode('authority') });
        const { path } = getAccountPath({ accounts: [self], data, provides });
        await expectCodamaError(
            resolveInstructionAccountAddress({ dataInput: {}, fetchAccounts: getFetchAccounts([]), path }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__CIRCULAR_ACCOUNT_DEPENDENCY, {
                chain: 'data.authority -> mint -> data.authority',
            }),
        );
    });

    test('it does not support nested fields defaulting to account data', async () => {
        // Given a nested authority defaulting to the authority of the mint.
        const config = structTypeNode([
            structFieldTypeNode({
                defaultValue: injectedValueNode({ key: 'authority' }),
                identifier: 'authority',
                type: publicKeyTypeNode(),
            }),
        ]);
        const nestedData = structTypeNode([structFieldTypeNode({ identifier: 'config', type: config })]);
        const owner = account('owner', { defaultValue: dataValueNode('config.authority') });
        const { path } = getAccountPath({ accounts: [mintAccount(), owner], data: nestedData, provides });

        // Then it throws rather than reading account data codecs could not use.
        const fetchAccounts = getFetchAccounts([]);
        await expectCodamaError(
            resolveInstructionAccountAddress({
                accountsInput: { mint: MINT_ADDRESS },
                dataInput: { config: {} },
                fetchAccounts,
                path,
            }),
            // The default value is injected by the instruction, so its path is the provided value itself.
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE, { path: [provides[0].node] }),
        );
        expect(fetchAccounts).not.toHaveBeenCalled();
    });

    test('it does not support other contextual values', async () => {
        const owner = account('owner', { defaultValue: dataValueNode('authority') });
        const { path } = getAccountPath({
            accounts: [owner],
            data,
            provides: [providedNode('authority', accountValueNode('owner'))],
        });
        await expectCodamaError(
            resolveInstructionAccountAddress({ dataInput: {}, path }),
            new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNSUPPORTED_NODE, { path: [accountValueNode('owner')] }),
        );
    });
});

describe('resolveInstructionDataDefaultValues', () => {
    const decimals = structFieldTypeNode({
        defaultValue: injectedValueNode({ key: 'decimals' }),
        identifier: 'decimals',
        type: integerTypeNode('u8'),
    });
    const provides = [providedNode('decimals', accountDataValueNode('mint', { path: 'decimals' }))];

    test('it resolves the default values injected from account data', async () => {
        const { instructionPath, root } = getPath({
            accounts: [mintAccount()],
            data: structTypeNode([decimals]),
            provides,
        });
        const fetchAccounts = getFetchAccounts([
            encodeAccount(root, 'mint', MINT_ADDRESS, { decimals: 6, mintAuthority: OTHER_ADDRESS }),
        ]);
        const values = await resolveInstructionDataDefaultValues({
            accountsInput: { mint: MINT_ADDRESS },
            dataInput: {},
            fetchAccounts,
            path: instructionPath,
        });
        expect(values).toEqual(new Map([[decimals, 6n]]));
    });

    test('it skips fields provided in the data input', async () => {
        const fetchAccounts = getFetchAccounts([]);
        const { instructionPath } = getPath({ accounts: [mintAccount()], data: structTypeNode([decimals]), provides });
        const values = await resolveInstructionDataDefaultValues({
            accountsInput: { mint: MINT_ADDRESS },
            dataInput: { decimals: 9 },
            fetchAccounts,
            path: instructionPath,
        });
        expect(values).toEqual(new Map());
        expect(fetchAccounts).not.toHaveBeenCalled();
    });

    test('it resolves omitted fields even when provided in the data input', async () => {
        const omitted = structFieldTypeNode({ ...decimals, defaultValueStrategy: 'omitted' });
        const { instructionPath, root } = getPath({
            accounts: [mintAccount()],
            data: structTypeNode([omitted]),
            provides,
        });
        const fetchAccounts = getFetchAccounts([
            encodeAccount(root, 'mint', MINT_ADDRESS, { decimals: 6, mintAuthority: OTHER_ADDRESS }),
        ]);
        const values = await resolveInstructionDataDefaultValues({
            accountsInput: { mint: MINT_ADDRESS },
            dataInput: { decimals: 9 },
            fetchAccounts,
            path: instructionPath,
        });
        expect(values).toEqual(new Map([[omitted, 6n]]));
    });

    test('it skips default values that codecs evaluate', async () => {
        const fee = structFieldTypeNode({
            defaultValue: injectedValueNode({ key: 'fee' }),
            identifier: 'fee',
            type: integerTypeNode('u8'),
        });
        const { instructionPath } = getPath({
            data: structTypeNode([fee]),
            provides: [providedNode('fee', integerValueNode('5'))],
        });
        expect(await resolveInstructionDataDefaultValues({ path: instructionPath })).toEqual(new Map());
    });

    test('it resolves the fields of linked data types', async () => {
        const { instructionPath, root: base } = getPath({ accounts: [mintAccount()], provides });
        const instruction = instructionNode({ ...instructionPath[2], data: definedTypeLinkNode('args') });
        const root = rootNode(
            programNode({
                ...base.program,
                definedTypes: [definedTypeNode({ identifier: 'args', type: structTypeNode([decimals]) })],
                instructions: [instruction],
            }),
        );
        const fetchAccounts = getFetchAccounts([
            encodeAccount(root, 'mint', MINT_ADDRESS, { decimals: 6, mintAuthority: OTHER_ADDRESS }),
        ]);
        const values = await resolveInstructionDataDefaultValues({
            accountsInput: { mint: MINT_ADDRESS },
            fetchAccounts,
            path: [root, root.program, instruction],
        });
        expect(values).toEqual(new Map([[decimals, 6n]]));
    });
});

describe('given linkables', () => {
    // Linkables that do not record the mint account, so following its account link fails.
    const linkedNodeNotFound = expect.objectContaining({
        context: expect.objectContaining({ __code: CODAMA_ERROR__LINKED_NODE_NOT_FOUND }),
    });

    test('it uses them to resolve instruction account addresses', async () => {
        const owner = account('owner', { defaultValue: accountDataValueNode('mint', { path: 'mintAuthority' }) });
        const { path } = getAccountPath({ accounts: [mintAccount(), owner] });
        const promise = resolveInstructionAccountAddress({
            accountsInput: { mint: MINT_ADDRESS },
            fetchAccounts: getFetchAccounts([]),
            linkables: new LinkableDictionary(),
            path,
        });
        await expect(promise).rejects.toThrow(linkedNodeNotFound);
    });

    test('it uses them to resolve instruction data default values', async () => {
        const decimals = structFieldTypeNode({
            defaultValue: injectedValueNode({ key: 'decimals' }),
            identifier: 'decimals',
            type: integerTypeNode('u8'),
        });
        const { instructionPath } = getPath({
            accounts: [mintAccount()],
            data: structTypeNode([decimals]),
            provides: [providedNode('decimals', accountDataValueNode('mint', { path: 'decimals' }))],
        });
        const promise = resolveInstructionDataDefaultValues({
            accountsInput: { mint: MINT_ADDRESS },
            fetchAccounts: getFetchAccounts([]),
            linkables: new LinkableDictionary(),
            path: instructionPath,
        });
        await expect(promise).rejects.toThrow(linkedNodeNotFound);
    });
});
