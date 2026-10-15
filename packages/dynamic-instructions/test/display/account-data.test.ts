import { getNodeValueCodec } from '@codama/dynamic-codecs';
import { parseInstruction } from '@codama/dynamic-parsers';
import type { EncodedAccount, MaybeEncodedAccount } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import { type AccountMeta, AccountRole } from '@solana/instructions';
import {
    accountDataValueNode,
    accountLinkNode,
    accountNode,
    accountValueNode,
    amountNumberDisplayNode,
    dataValueNode,
    type DefinedTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    fieldDiscriminatorNode,
    injectedValueNode,
    instructionAccountDisplayNode,
    instructionAccountNode,
    type InstructionAccountNodeInput,
    instructionDisplayNode,
    instructionNode,
    type InstructionNodeInput,
    integerTypeNode,
    integerValueNode,
    programNode,
    providedNode,
    publicKeyTypeNode,
    rootNode,
    stringTypeNode,
    structFieldDisplayNode,
    structFieldTypeNode,
    type StructFieldTypeNodeInput,
    structFieldValueNode,
    structTypeNode,
    structValueNode,
    type TypeNode,
    unitNumberDisplayNode,
    valueLabelDisplayNode,
} from 'codama';
import { describe, expect, test, vi } from 'vitest';

import {
    type DisplayAccountMap,
    encodeInstructionData,
    type FetchMaybeAccountsFn,
    getDisplayAccountMap,
    getInstructionDisplay,
    getInstructionDisplayFromParsedInstruction,
} from '../../src';
import { PROGRAM_ADDRESS } from '../_setup';

const MINT = 'So11111111111111111111111111111111111111112' as Address;
const TOKEN = 'SysvarRent111111111111111111111111111111111' as Address;
const OWNER = '11111111111111111111111111111111' as Address;

const field = (identifier: string, type: TypeNode, input: Partial<StructFieldTypeNodeInput> = {}) =>
    structFieldTypeNode({ identifier, type, ...input });
const data = (...fields: ReturnType<typeof field>[]) => structTypeNode(fields);
const account = (identifier: string, input: Partial<InstructionAccountNodeInput> = {}) =>
    instructionAccountNode({ identifier, isSigner: false, isWritable: false, ...input });
const readonly = (address: Address): AccountMeta => ({ address, role: AccountRole.READONLY });
const u8 = integerTypeNode('u8');
const decimalsAmount = integerTypeNode('u64', {
    display: amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) }),
});

// A mint holding its decimals and symbol, and a token account linking to its mint.
const mint = accountNode({
    data: data(field('decimals', u8), field('symbol', stringTypeNode('utf8'))),
    identifier: 'mint',
});
const token = accountNode({
    data: data(field('mint', publicKeyTypeNode({ accountLink: accountLinkNode('mint') }))),
    identifier: 'token',
});

/** A program with the mint and token accounts and the given instruction, with helpers to parse it and encode accounts. */
function setup(instructionInput: Partial<InstructionNodeInput>, definedTypes: DefinedTypeNode[] = []) {
    const instruction = instructionNode({ identifier: 'transfer', ...instructionInput });
    const root = rootNode(
        programNode({
            accounts: [mint, token],
            definedTypes,
            identifier: 'token',
            instructions: [instruction],
            publicKey: PROGRAM_ADDRESS,
        }),
    );
    const parse = (input: { accounts?: AccountMeta[]; data?: unknown } = {}) => {
        const instructionData = encodeInstructionData([root, root.program, instruction], input.data);
        const accounts = input.accounts ?? [];
        return parseInstruction(root, { accounts, data: instructionData, programAddress: PROGRAM_ADDRESS })!;
    };
    const encode = (node: typeof mint, address: Address, value: unknown): EncodedAccount => {
        const accountData = getNodeValueCodec([root, root.program, node]).encode(value) as Uint8Array;
        return {
            address,
            data: accountData,
            executable: false,
            lamports: 0n as EncodedAccount['lamports'],
            programAddress: PROGRAM_ADDRESS,
            space: BigInt(accountData.length),
        };
    };
    return { encode, parse, root };
}

/** A `fetchAccounts` function returning the given accounts, and non-existent accounts otherwise. */
const getFetchAccounts = (accounts: EncodedAccount[]) =>
    vi.fn<FetchMaybeAccountsFn>(addresses =>
        Promise.resolve(
            addresses.map((address): MaybeEncodedAccount => {
                const found = accounts.find(a => a.address === address);
                return found ? ({ ...found, exists: true } as MaybeEncodedAccount) : { address, exists: false };
            }),
        ),
    );

const mintAccount = account('mint', { accountLink: accountLinkNode('mint') });
const decimalsFromMint = providedNode('decimals', accountDataValueNode('mint', { path: 'decimals' }));

describe('injected values read from accounts', () => {
    const instructionInput = {
        accounts: [mintAccount],
        data: data(field('amount', decimalsAmount)),
        provides: [decimalsFromMint],
    };

    test('it reads injected values from the data of instruction accounts', () => {
        const { encode, parse, root } = setup(instructionInput);
        const accounts = new Map([[MINT, encode(mint, MINT, { decimals: 6, symbol: 'USDC' })]]);
        const parsed = parse({ accounts: [readonly(MINT)], data: { amount: 1_500_000n } });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed, { accounts }).fields[0]).toStrictEqual({
            label: 'Amount',
            value: '1.5',
        });
    });

    test('it does not resolve them when the account is not available', () => {
        const { parse, root } = setup(instructionInput);
        const parsed = parse({ accounts: [readonly(MINT)], data: { amount: 1_500_000n } });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed).fields[0]).toStrictEqual({
            label: 'Amount',
            value: '1500000 (raw)',
        });
    });

    test('it does not resolve them when the account data does not decode', () => {
        const { encode, parse, root } = setup(instructionInput);
        const accounts = new Map([
            [MINT, { ...encode(mint, MINT, { decimals: 6, symbol: 'USDC' }), data: new Uint8Array([]) }],
        ]);
        const parsed = parse({ accounts: [readonly(MINT)], data: { amount: 1_500_000n } });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed, { accounts }).fields[0]).toStrictEqual({
            label: 'Amount',
            value: '1500000 (raw)',
        });
    });

    test('it does not resolve them when the account does not match the discriminators of the linked account', () => {
        // Given a mint discriminated by its first byte, and another account at its address that decodes as one.
        const discriminatedMint = accountNode({
            data: data(
                field('discriminator', u8, { defaultValue: integerValueNode('1'), defaultValueStrategy: 'omitted' }),
                field('decimals', u8),
            ),
            discriminators: [fieldDiscriminatorNode('discriminator')],
            identifier: 'mint',
        });
        const instruction = instructionNode({ identifier: 'transfer', ...instructionInput });
        const root = rootNode(
            programNode({
                accounts: [discriminatedMint],
                identifier: 'token',
                instructions: [instruction],
                publicKey: PROGRAM_ADDRESS,
            }),
        );
        const other = new Uint8Array([2, 6]);
        const accounts = new Map([
            [
                MINT,
                {
                    address: MINT,
                    data: other,
                    executable: false,
                    lamports: 0n as EncodedAccount['lamports'],
                    programAddress: PROGRAM_ADDRESS,
                    space: 2n,
                },
            ],
        ]);
        const instructionData = encodeInstructionData([root, root.program, instruction], { amount: 1_500_000n });
        const parsed = parseInstruction(root, {
            accounts: [readonly(MINT)],
            data: instructionData,
            programAddress: PROGRAM_ADDRESS,
        })!;

        // Then its values are not presented, as they would be with the right account.
        expect(getInstructionDisplayFromParsedInstruction(root, parsed, { accounts }).fields[0].value).toBe(
            '1500000 (raw)',
        );
        const mintAccounts = new Map([[MINT, { ...accounts.get(MINT)!, data: new Uint8Array([1, 6]) }]]);
        expect(
            getInstructionDisplayFromParsedInstruction(root, parsed, { accounts: mintAccounts }).fields[0].value,
        ).toBe('1.5');
    });

    test('it reads injected values across account links of the instruction data', () => {
        const { encode, parse, root } = setup({
            data: data(
                field('amount', decimalsAmount),
                field('mint', publicKeyTypeNode({ accountLink: accountLinkNode('mint') })),
            ),
            provides: [providedNode('decimals', dataValueNode('mint.data.decimals'))],
        });
        const accounts = new Map([[MINT, encode(mint, MINT, { decimals: 6, symbol: 'USDC' })]]);
        const parsed = parse({ data: { amount: 1_500_000n, mint: MINT } });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed, { accounts }).fields[0]).toStrictEqual({
            label: 'Amount',
            value: '1.5',
        });
    });

    test('it reads injected values across account links of account data', () => {
        const { encode, parse, root } = setup({
            accounts: [account('source', { accountLink: accountLinkNode('token') })],
            data: data(field('amount', decimalsAmount)),
            provides: [providedNode('decimals', accountDataValueNode('source', { path: 'mint.data.decimals' }))],
        });
        const accounts = new Map([
            [TOKEN, encode(token, TOKEN, { mint: MINT })],
            [MINT, encode(mint, MINT, { decimals: 6, symbol: 'USDC' })],
        ]);
        const parsed = parse({ accounts: [readonly(TOKEN)], data: { amount: 1_500_000n } });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed, { accounts }).fields[0]).toStrictEqual({
            label: 'Amount',
            value: '1.5',
        });
    });
});

test('it reads injected values from the whole data of instruction accounts', () => {
    // Given a unit read from an account whose data is a single address.
    const pointer = accountNode({ data: publicKeyTypeNode(), identifier: 'pointer' });
    const unit = integerTypeNode('u8', {
        display: unitNumberDisplayNode({ unit: injectedValueNode({ key: 'unit' }) }),
    });
    const instruction = instructionNode({
        accounts: [account('pointer', { accountLink: accountLinkNode('pointer') })],
        data: data(field('count', unit)),
        identifier: 'count',
        provides: [providedNode('unit', accountDataValueNode('pointer'))],
    });
    const root = rootNode(
        programNode({
            accounts: [pointer],
            identifier: 'token',
            instructions: [instruction],
            publicKey: PROGRAM_ADDRESS,
        }),
    );
    const pointerData = getNodeValueCodec([root, root.program, pointer]).encode(MINT) as Uint8Array;
    const accounts = new Map([
        [
            TOKEN,
            {
                address: TOKEN,
                data: pointerData,
                executable: false,
                lamports: 0n as EncodedAccount['lamports'],
                programAddress: PROGRAM_ADDRESS,
                space: 32n,
            },
        ],
    ]);
    const instructionData = encodeInstructionData([root, root.program, instruction], { count: 3 });
    const parsed = parseInstruction(root, {
        accounts: [readonly(TOKEN)],
        data: instructionData,
        programAddress: PROGRAM_ADDRESS,
    })!;

    // Then the address is formatted as a unit.
    const display = getInstructionDisplayFromParsedInstruction(root, parsed, { accounts, formatAddress: () => 'USDC' });
    expect(display.fields[0]).toStrictEqual({ label: 'Count', value: '3 USDC' });
});

test('it resolves the provided values of placeholders within linked defined types', () => {
    // Given a labelled field within a linked defined type, whose fee defaults to a value the instruction provides.
    const settings = data(field('enabled', u8), field('fee', u8, { defaultValue: injectedValueNode({ key: 'fee' }) }));
    const defaults = valueLabelDisplayNode({
        label: 'Default settings',
        value: structValueNode([structFieldValueNode('enabled', integerValueNode('1'))]),
    });
    const config = definedTypeNode({
        identifier: 'config',
        type: data(field('settings', settings, { display: structFieldDisplayNode({ valueLabels: [defaults] }) })),
    });
    const { parse, root } = setup(
        {
            data: data(field('config', definedTypeLinkNode('config'))),
            display: instructionDisplayNode({ interpolatedIntent: 'Use ${data.config.settings}' }),
            provides: [providedNode('fee', integerValueNode('5'))],
        },
        [config],
    );

    // Then the placeholder presents the label, matched with the provided fee.
    const parsed = parse({ data: { config: { settings: { enabled: 1, fee: 5 } } } });
    expect(getInstructionDisplayFromParsedInstruction(root, parsed).interpolatedIntent).toBe('Use Default settings');
});

describe('placeholders reading accounts', () => {
    const intent = (interpolatedIntent: string) => instructionDisplayNode({ interpolatedIntent });

    test('it fills placeholders with the data of instruction accounts', () => {
        const { encode, parse, root } = setup({
            accounts: [mintAccount],
            display: intent('Mint of ${accounts.mint.data.symbol}'),
        });
        const accounts = new Map([[MINT, encode(mint, MINT, { decimals: 6, symbol: 'USDC' })]]);
        const parsed = parse({ accounts: [readonly(MINT)] });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed, { accounts }).interpolatedIntent).toBe(
            'Mint of USDC',
        );
    });

    test('it fills placeholders with values whose injected values are read from accounts', () => {
        const { encode, parse, root } = setup({
            accounts: [mintAccount],
            data: data(field('amount', decimalsAmount)),
            display: intent('Transfer ${data.amount}'),
            provides: [decimalsFromMint],
        });
        const accounts = new Map([[MINT, encode(mint, MINT, { decimals: 6, symbol: 'USDC' })]]);
        const parsed = parse({ accounts: [readonly(MINT)], data: { amount: 1_500_000n } });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed, { accounts }).interpolatedIntent).toBe(
            'Transfer 1.5',
        );
    });

    test('it fills placeholders with the whole data of instruction accounts', () => {
        const { encode, parse, root } = setup({
            accounts: [mintAccount],
            display: intent('Mint: ${accounts.mint.data}'),
        });
        const accounts = new Map([[MINT, encode(mint, MINT, { decimals: 6, symbol: 'USDC' })]]);
        const parsed = parse({ accounts: [readonly(MINT)] });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed, { accounts }).interpolatedIntent).toBe(
            'Mint: Decimals: 6, Symbol: USDC',
        );
    });

    test('it fills placeholders across account links', () => {
        const { encode, parse, root } = setup({
            accounts: [account('source', { accountLink: accountLinkNode('token') })],
            data: data(field('mint', publicKeyTypeNode({ accountLink: accountLinkNode('mint') }))),
            display: intent('${data.mint.data.symbol} from a ${accounts.source.data.mint.data.symbol} account'),
        });
        const accounts = new Map([
            [TOKEN, encode(token, TOKEN, { mint: MINT })],
            [MINT, encode(mint, MINT, { decimals: 6, symbol: 'USDC' })],
        ]);
        const parsed = parse({ accounts: [readonly(TOKEN)], data: { mint: MINT } });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed, { accounts }).interpolatedIntent).toBe(
            'USDC from a USDC account',
        );
    });

    test('it fills placeholders with the whole data of linked accounts', () => {
        const { encode, parse, root } = setup({
            data: data(field('mint', publicKeyTypeNode({ accountLink: accountLinkNode('mint') }))),
            display: intent('Mint: ${data.mint.data}'),
        });
        const accounts = new Map([[MINT, encode(mint, MINT, { decimals: 6, symbol: 'USDC' })]]);
        const parsed = parse({ data: { mint: MINT } });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed, { accounts }).interpolatedIntent).toBe(
            'Mint: Decimals: 6, Symbol: USDC',
        );
    });

    test('it is null when the account is not available', () => {
        const { parse, root } = setup({
            accounts: [mintAccount],
            display: intent('Mint of ${accounts.mint.data.symbol}'),
        });
        expect(
            getInstructionDisplayFromParsedInstruction(root, parse({ accounts: [readonly(MINT)] })).interpolatedIntent,
        ).toBeNull();
    });
});

describe('members skipped when injected', () => {
    // A transfer whose amount reads its decimals from the data and its unit from the mint account.
    const unitAmount = integerTypeNode('u64', {
        display: amountNumberDisplayNode({
            decimals: injectedValueNode({ key: 'decimals' }),
            unit: injectedValueNode({ key: 'unit' }),
        }),
    });
    const whenInjected = { display: structFieldDisplayNode({ skip: 'whenInjected' }) };
    const transfer = {
        accounts: [
            account('mint', { display: instructionAccountDisplayNode({ skip: 'whenInjected' }) }),
            account('destination'),
        ],
        data: data(field('amount', unitAmount), field('decimals', u8, whenInjected)),
        provides: [providedNode('decimals', dataValueNode('decimals')), providedNode('unit', accountValueNode('mint'))],
    };

    test('it leaves out members whose value another row presents', () => {
        const { parse, root } = setup(transfer);
        const parsed = parse({
            accounts: [readonly(MINT), readonly(OWNER)],
            data: { amount: 1_500_000n, decimals: 6 },
        });
        expect(
            getInstructionDisplayFromParsedInstruction(root, parsed, { formatAddress: () => 'USDC' }).fields,
        ).toStrictEqual([
            { label: 'Amount', value: '1.5 USDC' },
            { label: 'Destination', value: 'USDC' },
        ]);
    });

    test('it shows members whose value cannot be presented', () => {
        // Given the decimals and the mint unit provided from the mint account, which is not available.
        const { parse, root } = setup({
            ...transfer,
            accounts: [
                account('mint', {
                    accountLink: accountLinkNode('mint'),
                    display: instructionAccountDisplayNode({ skip: 'whenInjected' }),
                }),
            ],
            data: data(field('amount', unitAmount)),
            provides: [decimalsFromMint, providedNode('unit', accountDataValueNode('mint', { path: 'symbol' }))],
        });
        const parsed = parse({ accounts: [readonly(MINT)], data: { amount: 1_500_000n } });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed).fields).toStrictEqual([
            { label: 'Amount', value: '1500000 (raw)' },
            { label: 'Mint', value: MINT },
        ]);
    });

    test('it leaves out members read through account data once available', () => {
        const { encode, parse, root } = setup({
            accounts: [
                account('mint', {
                    accountLink: accountLinkNode('mint'),
                    display: instructionAccountDisplayNode({ skip: 'whenInjected' }),
                }),
            ],
            data: data(field('amount', decimalsAmount)),
            provides: [decimalsFromMint],
        });
        const accounts = new Map([[MINT, encode(mint, MINT, { decimals: 6, symbol: 'USDC' })]]);
        const parsed = parse({ accounts: [readonly(MINT)], data: { amount: 1_500_000n } });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed, { accounts }).fields).toStrictEqual([
            { label: 'Amount', value: '1.5' },
        ]);
    });

    test('it only counts rows that are always shown', () => {
        // Given the amount itself skipped when injected, so it cannot hide the decimals.
        const { parse, root } = setup({
            ...transfer,
            data: data(field('amount', unitAmount, whenInjected), field('decimals', u8, whenInjected)),
        });
        const parsed = parse({
            accounts: [readonly(MINT), readonly(OWNER)],
            data: { amount: 1_500_000n, decimals: 6 },
        });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed).fields.map(row => row.label)).toStrictEqual([
            'Amount',
            'Decimals',
            'Mint',
            'Destination',
        ]);
    });

    test('it leaves out data fields read across account links', () => {
        // Given decimals read from the mint a data field links to.
        const { encode, parse, root } = setup({
            data: data(
                field('amount', decimalsAmount),
                field('mint', publicKeyTypeNode({ accountLink: accountLinkNode('mint') }), whenInjected),
            ),
            provides: [providedNode('decimals', dataValueNode('mint.data.decimals'))],
        });
        const accounts = new Map([[MINT, encode(mint, MINT, { decimals: 6, symbol: 'USDC' })]]);
        const parsed = parse({ data: { amount: 1_500_000n, mint: MINT } });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed, { accounts }).fields).toStrictEqual([
            { label: 'Amount', value: '1.5' },
        ]);
    });

    test('it only counts the reads of the row presenting them', () => {
        // Given the amount reading the decimals is itself skipped when injected, next to a shown fee.
        const { parse, root } = setup({
            data: data(
                field('amount', decimalsAmount, whenInjected),
                field('fee', u8),
                field('decimals', u8, whenInjected),
            ),
            provides: [providedNode('decimals', dataValueNode('decimals'))],
        });
        const parsed = parse({ data: { amount: 1_500_000n, decimals: 6, fee: 1 } });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed).fields.map(row => row.label)).toStrictEqual([
            'Amount',
            'Fee',
            'Decimals',
        ]);
    });

    test('it leaves out members read by instruction data that is not a struct', () => {
        const { parse, root } = setup({
            ...transfer,
            data: integerTypeNode('u64', {
                display: unitNumberDisplayNode({ unit: injectedValueNode({ key: 'unit' }) }),
            }),
            provides: [providedNode('unit', accountValueNode('mint'))],
        });
        const parsed = parse({ accounts: [readonly(MINT), readonly(OWNER)], data: 42n });
        expect(
            getInstructionDisplayFromParsedInstruction(root, parsed, { formatAddress: () => 'USDC' }).fields,
        ).toStrictEqual([
            { label: 'Data', value: '42 USDC' },
            { label: 'Destination', value: 'USDC' },
        ]);
    });

    test('it leaves out fields of flattened structs linking to a defined type', () => {
        const config = definedTypeNode({
            identifier: 'config',
            type: data(field('amount', decimalsAmount), field('decimals', u8, whenInjected)),
        });
        const { parse, root } = setup(
            {
                data: data(
                    field('config', definedTypeLinkNode('config'), {
                        display: structFieldDisplayNode({ flatten: true }),
                    }),
                ),
                provides: [providedNode('decimals', dataValueNode('config.decimals'))],
            },
            [config],
        );
        const parsed = parse({ data: { config: { amount: 1_500_000n, decimals: 6 } } });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed).fields).toStrictEqual([
            { label: 'Amount', value: '1.5' },
        ]);
    });

    test('it leaves out members read by fields linking to a defined type', () => {
        // Given a leg whose amount names its mint, which is skipped when injected.
        const unitFromMint = integerTypeNode('u64', {
            display: unitNumberDisplayNode({ unit: injectedValueNode({ key: 'unit' }) }),
        });
        const leg = definedTypeNode({ identifier: 'leg', type: data(field('amount', unitFromMint)) });
        const { parse, root } = setup(
            {
                accounts: [account('mint', { display: instructionAccountDisplayNode({ skip: 'whenInjected' }) })],
                data: data(field('leg', definedTypeLinkNode('leg'))),
                provides: [providedNode('unit', accountValueNode('mint'))],
            },
            [leg],
        );
        const parsed = parse({ accounts: [readonly(MINT)], data: { leg: { amount: 42n } } });
        expect(
            getInstructionDisplayFromParsedInstruction(root, parsed, { formatAddress: () => 'USDC' }).fields,
        ).toStrictEqual([{ label: 'Leg', value: 'Amount: 42 USDC' }]);
    });

    test('it only counts the reads of the fields within a row', () => {
        // Given a shown amount next to a config, skipped when injected, whose own amount names the mint.
        const unitFromMint = integerTypeNode('u64', {
            display: unitNumberDisplayNode({ unit: injectedValueNode({ key: 'unit' }) }),
        });
        const { parse, root } = setup({
            accounts: [account('mint', { display: instructionAccountDisplayNode({ skip: 'whenInjected' }) })],
            data: data(field('amount', u8), field('config', data(field('amount', unitFromMint)), whenInjected)),
            provides: [providedNode('unit', accountValueNode('mint'))],
        });
        const parsed = parse({ accounts: [readonly(MINT)], data: { amount: 1, config: { amount: 42n } } });

        // Then the mint is shown, since the only row presenting it is not always shown.
        expect(getInstructionDisplayFromParsedInstruction(root, parsed).fields.map(row => row.label)).toStrictEqual([
            'Amount',
            'Config',
            'Mint',
        ]);
    });

    test('it leaves out fields of nested flattened structs by their path', () => {
        const flatten = { display: structFieldDisplayNode({ flatten: true }) };
        const inner = data(field('amount', decimalsAmount), field('decimals', u8, whenInjected));
        const { parse, root } = setup({
            data: data(field('outer', data(field('inner', inner, flatten)), flatten)),
            provides: [providedNode('decimals', dataValueNode('outer.inner.decimals'))],
        });
        const parsed = parse({ data: { outer: { inner: { amount: 1_500_000n, decimals: 6 } } } });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed).fields).toStrictEqual([
            { label: 'Amount', value: '1.5' },
        ]);
    });

    test('it leaves out fields of flattened structs by their path', () => {
        const config = data(field('amount', decimalsAmount), field('decimals', u8, whenInjected));
        const { parse, root } = setup({
            data: data(field('config', config, { display: structFieldDisplayNode({ flatten: true }) })),
            provides: [providedNode('decimals', dataValueNode('config.decimals'))],
        });
        const parsed = parse({ data: { config: { amount: 1_500_000n, decimals: 6 } } });
        expect(getInstructionDisplayFromParsedInstruction(root, parsed).fields).toStrictEqual([
            { label: 'Amount', value: '1.5' },
        ]);
    });
});

describe('getDisplayAccountMap', () => {
    const multiHop = {
        accounts: [account('source', { accountLink: accountLinkNode('token') })],
        data: data(field('amount', decimalsAmount)),
        provides: [providedNode('decimals', accountDataValueNode('source', { path: 'mint.data.decimals' }))],
    };

    test('it fetches the accounts the display reads, in rounds', async () => {
        const { encode, parse, root } = setup(multiHop);
        const tokenAccount = encode(token, TOKEN, { mint: MINT });
        const mintData = encode(mint, MINT, { decimals: 6, symbol: 'USDC' });
        const fetchAccounts = getFetchAccounts([tokenAccount, mintData]);
        const accounts = await getDisplayAccountMap(
            root,
            parse({ accounts: [readonly(TOKEN)], data: { amount: 1n } }),
            fetchAccounts,
        );
        expect(fetchAccounts.mock.calls).toEqual([[[TOKEN]], [[MINT]]]);
        expect(accounts).toEqual(
            new Map([
                [TOKEN, tokenAccount],
                [MINT, mintData],
            ]),
        );
    });

    test('it fetches the accounts read together in a single call', async () => {
        const { encode, parse, root } = setup({
            accounts: [mintAccount, account('source', { accountLink: accountLinkNode('token') })],
            display: instructionDisplayNode({
                interpolatedIntent: '${accounts.mint.data.symbol} ${accounts.source.data.mint}',
            }),
        });
        const fetchAccounts = getFetchAccounts([
            encode(mint, MINT, { decimals: 6, symbol: 'USDC' }),
            encode(token, TOKEN, { mint: MINT }),
        ]);
        await getDisplayAccountMap(root, parse({ accounts: [readonly(MINT), readonly(TOKEN)] }), fetchAccounts);
        expect(fetchAccounts.mock.calls).toEqual([[[MINT, TOKEN]]]);
    });

    test('it leaves out accounts that do not exist and does not fetch them again', async () => {
        const { parse, root } = setup(multiHop);
        const fetchAccounts = getFetchAccounts([]);
        const accounts = await getDisplayAccountMap(
            root,
            parse({ accounts: [readonly(TOKEN)], data: { amount: 1n } }),
            fetchAccounts,
        );
        expect(accounts).toEqual(new Map());
        expect(fetchAccounts).toHaveBeenCalledTimes(1);
    });

    test('it does not fetch the given accounts again', async () => {
        const { encode, parse, root } = setup(multiHop);
        const given: DisplayAccountMap = new Map([[TOKEN, encode(token, TOKEN, { mint: MINT })]]);
        const fetchAccounts = getFetchAccounts([encode(mint, MINT, { decimals: 6, symbol: 'USDC' })]);
        await getDisplayAccountMap(root, parse({ accounts: [readonly(TOKEN)], data: { amount: 1n } }), fetchAccounts, {
            accounts: given,
        });
        expect(fetchAccounts.mock.calls).toEqual([[[MINT]]]);
    });

    test('it does not fetch omitted accounts', async () => {
        // Given decimals read from an optional mint, omitted with the program address.
        const { parse, root } = setup({
            accounts: [account('mint', { accountLink: accountLinkNode('mint'), isOptional: true })],
            data: data(field('amount', decimalsAmount)),
            provides: [decimalsFromMint],
        });
        const fetchAccounts = getFetchAccounts([]);
        const parsed = parse({ accounts: [readonly(PROGRAM_ADDRESS)], data: { amount: 1n } });
        expect(await getDisplayAccountMap(root, parsed, fetchAccounts)).toEqual(new Map());
        expect(fetchAccounts).not.toHaveBeenCalled();
    });

    test('it does not fetch accounts that only fields skipped always read', async () => {
        const { parse, root } = setup({
            accounts: [mintAccount],
            data: data(field('amount', decimalsAmount, { display: structFieldDisplayNode({ skip: 'always' }) })),
            provides: [decimalsFromMint],
        });
        const fetchAccounts = getFetchAccounts([]);
        await getDisplayAccountMap(root, parse({ accounts: [readonly(MINT)], data: { amount: 1n } }), fetchAccounts);
        expect(fetchAccounts).not.toHaveBeenCalled();
    });

    test('it does not fetch accounts that only fields skipped always read within shown fields', async () => {
        const hidden = { display: structFieldDisplayNode({ skip: 'always' }) };
        const { parse, root } = setup({
            accounts: [mintAccount],
            data: data(field('config', data(field('amount', decimalsAmount, hidden), field('fee', u8)))),
            provides: [decimalsFromMint],
        });
        const fetchAccounts = getFetchAccounts([]);
        const parsed = parse({ accounts: [readonly(MINT)], data: { config: { amount: 1n, fee: 2 } } });
        await getDisplayAccountMap(root, parsed, fetchAccounts);
        expect(fetchAccounts).not.toHaveBeenCalled();
    });

    test('it does not fetch accounts that only fields skipped always read when the instruction has an interpolated intent', async () => {
        const { parse, root } = setup({
            accounts: [mintAccount],
            data: data(
                field('amount', decimalsAmount, { display: structFieldDisplayNode({ skip: 'always' }) }),
                field('fee', u8),
            ),
            display: instructionDisplayNode({ interpolatedIntent: 'Pay a fee of ${data.fee}' }),
            provides: [decimalsFromMint],
        });
        const fetchAccounts = getFetchAccounts([]);
        const parsed = parse({ accounts: [readonly(MINT)], data: { amount: 1n, fee: 2 } });
        await getDisplayAccountMap(root, parsed, fetchAccounts);
        expect(fetchAccounts).not.toHaveBeenCalled();
    });

    test('it does not fetch accounts that only hidden fields linking to a defined type read', async () => {
        const config = definedTypeNode({ identifier: 'config', type: data(field('amount', decimalsAmount)) });
        const hidden = { display: structFieldDisplayNode({ skip: 'always' }) };
        const { parse, root } = setup(
            {
                accounts: [mintAccount],
                data: data(field('config', definedTypeLinkNode('config'), hidden), field('fee', u8)),
                provides: [decimalsFromMint],
            },
            [config],
        );
        const fetchAccounts = getFetchAccounts([]);
        const parsed = parse({ accounts: [readonly(MINT)], data: { config: { amount: 1n }, fee: 2 } });
        await getDisplayAccountMap(root, parsed, fetchAccounts);
        expect(fetchAccounts).not.toHaveBeenCalled();
    });

    test('it does not fetch accounts that only hidden fields within a placeholder read', async () => {
        const hidden = { display: structFieldDisplayNode({ skip: 'always' }) };
        const { parse, root } = setup({
            accounts: [mintAccount],
            data: data(field('config', data(field('amount', decimalsAmount, hidden), field('fee', u8)))),
            display: instructionDisplayNode({ interpolatedIntent: 'Configure ${data.config}' }),
            provides: [decimalsFromMint],
        });
        const fetchAccounts = getFetchAccounts([]);
        const parsed = parse({ accounts: [readonly(MINT)], data: { config: { amount: 1n, fee: 2 } } });
        await getDisplayAccountMap(root, parsed, fetchAccounts);
        expect(fetchAccounts).not.toHaveBeenCalled();
        expect(getInstructionDisplayFromParsedInstruction(root, parsed).interpolatedIntent).toBe('Configure Fee: 2');
    });

    test('it fetches the accounts that a hidden field a placeholder refers to reads', async () => {
        const { parse, root } = setup({
            accounts: [mintAccount],
            data: data(field('amount', decimalsAmount, { display: structFieldDisplayNode({ skip: 'always' }) })),
            display: instructionDisplayNode({ interpolatedIntent: 'Transfer ${data.amount}' }),
            provides: [decimalsFromMint],
        });
        const fetchAccounts = getFetchAccounts([]);
        await getDisplayAccountMap(root, parse({ accounts: [readonly(MINT)], data: { amount: 1n } }), fetchAccounts);
        expect(fetchAccounts.mock.calls).toEqual([[[MINT]]]);
    });

    test('it does not fetch anything when the display reads no account', async () => {
        const { parse, root } = setup({ data: data(field('amount', integerTypeNode('u64'))) });
        const fetchAccounts = getFetchAccounts([]);
        expect(await getDisplayAccountMap(root, parse({ data: { amount: 1n } }), fetchAccounts)).toEqual(new Map());
        expect(fetchAccounts).not.toHaveBeenCalled();
    });
});

describe('getInstructionDisplay', () => {
    const instructionInput = {
        accounts: [mintAccount],
        data: data(field('amount', decimalsAmount)),
        provides: [decimalsFromMint],
    };

    test('it parses the instruction, fetches the accounts it reads and presents it', async () => {
        const { encode, root } = setup(instructionInput);
        const fetchAccounts = getFetchAccounts([encode(mint, MINT, { decimals: 6, symbol: 'USDC' })]);
        const instructionData = encodeInstructionData([root, root.program, root.program.instructions![0]], {
            amount: 1_500_000n,
        });
        const instruction = { accounts: [readonly(MINT)], data: instructionData, programAddress: PROGRAM_ADDRESS };
        const display = await getInstructionDisplay(root, instruction, { fetchAccounts });
        expect(display?.fields).toStrictEqual([
            { label: 'Amount', value: '1.5' },
            { label: 'Mint', value: MINT },
        ]);
    });

    test('it presents the instruction without fetching accounts', async () => {
        const { root } = setup(instructionInput);
        const instructionData = encodeInstructionData([root, root.program, root.program.instructions![0]], {
            amount: 1_500_000n,
        });
        const display = await getInstructionDisplay(root, {
            accounts: [readonly(MINT)],
            data: instructionData,
            programAddress: PROGRAM_ADDRESS,
        });
        expect(display?.fields[0]).toStrictEqual({ label: 'Amount', value: '1500000 (raw)' });
    });

    test('it returns null for instructions it cannot parse', async () => {
        const { root } = setup(instructionInput);
        const instruction = { accounts: [], data: new Uint8Array([1]), programAddress: OWNER };
        expect(await getInstructionDisplay(root, instruction)).toBeNull();
    });
});

test('it accepts string units read from account data', () => {
    const { encode, parse, root } = setup({
        accounts: [mintAccount],
        data: data(
            field(
                'amount',
                integerTypeNode('u64', {
                    display: amountNumberDisplayNode({
                        decimals: integerValueNode('6'),
                        unit: injectedValueNode({ key: 'unit' }),
                    }),
                }),
            ),
        ),
        provides: [providedNode('unit', accountDataValueNode('mint', { path: 'symbol' }))],
    });
    const accounts = new Map([[MINT, encode(mint, MINT, { decimals: 6, symbol: 'USDC' })]]);
    const parsed = parse({ accounts: [readonly(MINT)], data: { amount: 1_500_000n } });
    expect(getInstructionDisplayFromParsedInstruction(root, parsed, { accounts }).fields[0].value).toBe('1.5 USDC');
});
