import { parseInstruction } from '@codama/dynamic-parsers';
import { CODAMA_ERROR__LINKED_NODE_NOT_FOUND } from '@codama/errors';
import type { Address } from '@solana/addresses';
import { type AccountMeta, AccountRole } from '@solana/instructions';
import {
    accountDataValueNode,
    accountLinkNode,
    accountNode,
    accountValueNode,
    amountNumberDisplayNode,
    arrayTypeNode,
    arrayValueNode,
    dataValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumValueNode,
    enumVariantDisplayNode,
    enumVariantTypeNode,
    injectedValueNode,
    instructionAccountDisplayNode,
    instructionAccountNode,
    type InstructionAccountNodeInput,
    instructionDisplayNode,
    instructionNode,
    type InstructionNodeInput,
    instructionRemainingAccountsNode,
    integerTypeNode,
    integerValueNode,
    LinkableDictionary,
    optionTypeNode,
    prefixedCountNode,
    programIdValueNode,
    programLinkNode,
    type ProgramNodeInput,
    providedNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    stringTypeNode,
    stringValueNode,
    structFieldDisplayNode,
    structFieldTypeNode,
    type StructFieldTypeNodeInput,
    structFieldValueNode,
    structTypeNode,
    structValueNode,
    textNode,
    type TypeNode,
    unitNumberDisplayNode,
    valueLabelDisplayNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import {
    encodeInstructionData,
    getInstructionDisplayFromParsedInstruction,
    type GetInstructionDisplayOptions,
} from '../../src';
import { makeRoot, PROGRAM_ADDRESS } from '../_setup';

const ALICE = '11111111111111111111111111111111' as Address;
const BOB = 'SysvarRent111111111111111111111111111111111' as Address;
const CAROL = 'So11111111111111111111111111111111111111112' as Address;
const names = new Map<string, string>([
    [ALICE, 'Alice'],
    [BOB, 'Bob'],
    [CAROL, 'Carol'],
]);
const formatAddress = (address: Address) => names.get(address) ?? address;

/** Encode, parse and display an instruction of a program made of the given nodes. */
function display(
    instructionInput: Partial<InstructionNodeInput>,
    input: { accounts?: AccountMeta[]; data?: unknown } = {},
    options: GetInstructionDisplayOptions = {},
    programInput: Partial<ProgramNodeInput> = {},
) {
    const instruction = instructionNode({ identifier: 'transfer', ...instructionInput });
    const root = makeRoot([instruction], 'testProgram', programInput);
    const data = encodeInstructionData([root, root.program, instruction], input.data);
    const parsed = parseInstruction(root, { accounts: input.accounts ?? [], data, programAddress: PROGRAM_ADDRESS });
    return getInstructionDisplayFromParsedInstruction(root, parsed!, options);
}

const field = (identifier: string, type: TypeNode, input: Partial<StructFieldTypeNodeInput> = {}) =>
    structFieldTypeNode({ identifier, type, ...input });
const data = (...fields: ReturnType<typeof field>[]) => structTypeNode(fields);
const account = (identifier: string, input: Partial<InstructionAccountNodeInput> = {}) =>
    instructionAccountNode({ identifier, isSigner: false, isWritable: false, ...input });
const readonly = (address: Address): AccountMeta => ({ address, role: AccountRole.READONLY });
const signer = (address: Address): AccountMeta => ({ address, role: AccountRole.READONLY_SIGNER });
const u64 = integerTypeNode('u64');
const amount = (input: Parameters<typeof amountNumberDisplayNode>[0]) =>
    integerTypeNode('u64', { display: amountNumberDisplayNode(input) });

describe('intent', () => {
    test('it uses the intent of the display node', () => {
        expect(display({ display: instructionDisplayNode({ intent: 'Send' }) }).intent).toBe('Send');
    });

    test('it uses the identifier in title case otherwise', () => {
        expect(display({ identifier: 'transferChecked' }).intent).toBe('Transfer Checked');
    });
});

describe('data fields', () => {
    test('it shows a row per field, labelled and formatted', () => {
        const fields = display(
            {
                data: data(
                    field('amount', amount({ decimals: integerValueNode('6'), unit: stringValueNode('USDC') })),
                    field('memoId', u64),
                ),
            },
            { data: { amount: 1_500_000n, memoId: 42n } },
        ).fields;
        expect(fields).toStrictEqual([
            { label: 'Amount', value: '1.5 USDC' },
            { label: 'Memo Id', value: '42' },
        ]);
    });

    test('it uses the labels of display nodes', () => {
        const display_ = structFieldDisplayNode({ label: textNode({ content: 'Quantity' }) });
        const fields = display(
            { data: data(field('amount', u64, { display: display_ })) },
            { data: { amount: 42n } },
        ).fields;
        expect(fields).toStrictEqual([{ label: 'Quantity', value: '42' }]);
    });

    test('it leaves out fields skipped always', () => {
        const discriminator = field('discriminator', integerTypeNode('u8'), {
            display: structFieldDisplayNode({ skip: 'always' }),
        });
        const fields = display(
            { data: data(discriminator, field('amount', u64)) },
            { data: { amount: 42n, discriminator: 3 } },
        ).fields;
        expect(fields).toStrictEqual([{ label: 'Amount', value: '42' }]);
    });

    test('it shows fields skipped when injected', () => {
        const fee = field('fee', u64, { display: structFieldDisplayNode({ skip: 'whenInjected' }) });
        expect(display({ data: data(fee) }, { data: { fee: 5n } }).fields).toStrictEqual([
            { label: 'Fee', value: '5' },
        ]);
    });

    test('it shows nested structs as a single row', () => {
        const config = data(field('fee', u64), field('owner', publicKeyTypeNode()));
        const fields = display(
            { data: data(field('config', config)) },
            { data: { config: { fee: 5n, owner: ALICE } } },
            { formatAddress },
        ).fields;
        expect(fields).toStrictEqual([{ label: 'Config', value: 'Fee: 5, Owner: Alice' }]);
    });

    test('it replaces flattened structs by their prefixed fields', () => {
        const config = data(field('fee', u64), field('owner', publicKeyTypeNode()));
        const flattened = field('config', config, {
            display: structFieldDisplayNode({ flatten: true, flattenPrefix: 'Config ' }),
        });
        const fields = display({ data: data(flattened) }, { data: { config: { fee: 5n, owner: ALICE } } }).fields;
        expect(fields).toStrictEqual([
            { label: 'Config Fee', value: '5' },
            { label: 'Config Owner', value: ALICE },
        ]);
    });

    test('it shows one row per address of lists of addresses', () => {
        const signers = field('signers', arrayTypeNode(publicKeyTypeNode(), prefixedCountNode(integerTypeNode('u8'))));
        const fields = display({ data: data(signers) }, { data: { signers: [ALICE, BOB] } }, { formatAddress }).fields;
        expect(fields).toStrictEqual([
            { label: 'Signers #1', value: 'Alice' },
            { label: 'Signers #2', value: 'Bob' },
        ]);
    });

    test('it does not number lists of a single address', () => {
        const signers = field('signers', arrayTypeNode(publicKeyTypeNode(), prefixedCountNode(integerTypeNode('u8'))));
        expect(display({ data: data(signers) }, { data: { signers: [ALICE] } }).fields).toStrictEqual([
            { label: 'Signers', value: ALICE },
        ]);
    });

    test('it shows empty values as empty', () => {
        const fees = field('fees', arrayTypeNode(u64, prefixedCountNode(integerTypeNode('u8'))));
        const signers = field('signers', arrayTypeNode(publicKeyTypeNode(), prefixedCountNode(integerTypeNode('u8'))));
        expect(display({ data: data(fees, signers) }, { data: { fees: [], signers: [] } }).fields).toStrictEqual([
            { label: 'Fees', value: 'Empty' },
            { label: 'Signers', value: 'Empty' },
        ]);
    });

    test('it shows lists of other values as a single row', () => {
        const fees = field('fees', arrayTypeNode(u64, prefixedCountNode(integerTypeNode('u8'))));
        expect(display({ data: data(fees) }, { data: { fees: [1n, 2n] } }).fields).toStrictEqual([
            { label: 'Fees', value: '1, 2' },
        ]);
    });

    test('it shows one row per address of optional lists of addresses', () => {
        const list = arrayTypeNode(publicKeyTypeNode(), prefixedCountNode(integerTypeNode('u8')));
        const signers = field('signers', optionTypeNode(list, { prefix: integerTypeNode('u8') }));
        const fields = display({ data: data(signers) }, { data: { signers: [ALICE, BOB] } }, { formatAddress }).fields;
        expect(fields).toStrictEqual([
            { label: 'Signers #1', value: 'Alice' },
            { label: 'Signers #2', value: 'Bob' },
        ]);
    });

    test('it shows the labels of enum variants', () => {
        const mode = definedTypeNode({
            identifier: 'mode',
            type: enumTypeNode([
                enumVariantTypeNode('fast'),
                enumVariantTypeNode('slow', { display: enumVariantDisplayNode({ label: 'Economy' }) }),
            ]),
        });
        const fields = display(
            { data: data(field('mode', definedTypeLinkNode('mode'))) },
            { data: { mode: 'slow' } },
            {},
            { definedTypes: [mode] },
        ).fields;
        expect(fields).toStrictEqual([{ label: 'Mode', value: 'Economy' }]);
    });

    test('it shows instruction data that is not a struct as a single row', () => {
        expect(display({ data: u64 }, { data: 42n }).fields).toStrictEqual([{ label: 'Data', value: '42' }]);
    });

    test('it passes formatting options to the formatters', () => {
        const fields = display(
            { data: data(field('amount', u64)) },
            { data: { amount: 1_234_567n } },
            { numberFormat: new Intl.NumberFormat('en-US') },
        ).fields;
        expect(fields).toStrictEqual([{ label: 'Amount', value: '1,234,567' }]);
    });
});

describe('value labels', () => {
    const all = valueLabelDisplayNode({ label: 'All', value: integerValueNode('18446744073709551615') });
    const withLabels = (type: TypeNode, input: Parameters<typeof structFieldDisplayNode>[0] = {}) =>
        field('amount', type, { display: structFieldDisplayNode({ ...input, valueLabels: [all] }) });

    test('it shows the value label of a field matching it', () => {
        const fields = display(
            { data: data(withLabels(u64)) },
            { data: { amount: 18_446_744_073_709_551_615n } },
        ).fields;
        expect(fields).toStrictEqual([{ label: 'Amount', value: 'All' }]);
    });

    test('it shows the formatted value otherwise', () => {
        expect(display({ data: data(withLabels(u64)) }, { data: { amount: 42n } }).fields).toStrictEqual([
            { label: 'Amount', value: '42' },
        ]);
    });

    test('it shows the value label of a placeholder', () => {
        const instruction = {
            data: data(withLabels(u64)),
            display: instructionDisplayNode({ interpolatedIntent: 'Transfer ${data.amount}' }),
        };
        expect(display(instruction, { data: { amount: 18_446_744_073_709_551_615n } }).interpolatedIntent).toBe(
            'Transfer All',
        );
    });

    test('it shows the value labels of nested fields', () => {
        const config = data(withLabels(u64));
        expect(
            display(
                { data: data(field('config', config)) },
                { data: { config: { amount: 18_446_744_073_709_551_615n } } },
            ).fields,
        ).toStrictEqual([{ label: 'Config', value: 'Amount: All' }]);
    });

    test('it shows the value label of lists of addresses as a single row', () => {
        const label = valueLabelDisplayNode({
            label: 'Just Alice',
            value: arrayValueNode([publicKeyValueNode(ALICE)]),
        });
        const signers = field('signers', arrayTypeNode(publicKeyTypeNode(), prefixedCountNode(integerTypeNode('u8'))), {
            display: structFieldDisplayNode({ valueLabels: [label] }),
        });
        expect(display({ data: data(signers) }, { data: { signers: [ALICE] } }).fields).toStrictEqual([
            { label: 'Signers', value: 'Just Alice' },
        ]);
    });

    test('it shows the value label of flattened fields as a single row', () => {
        // Given a flattened config labelled as a whole.
        const config = data(field('fee', u64));
        const defaults = valueLabelDisplayNode({ label: 'Default config', value: structValue(5n) });
        const flattened = field('config', config, {
            display: structFieldDisplayNode({ flatten: true, valueLabels: [defaults] }),
        });

        // Then the label replaces its fields.
        expect(display({ data: data(flattened) }, { data: { config: { fee: 5n } } }).fields).toStrictEqual([
            { label: 'Config', value: 'Default config' },
        ]);
    });
});

describe('degraded amounts', () => {
    const unresolved = amount({ decimals: injectedValueNode({ key: 'decimals' }) });

    test('it marks the raw value of amounts whose decimals cannot be resolved', () => {
        expect(
            display({ data: data(field('amount', unresolved)) }, { data: { amount: 1_500_000n } }).fields,
        ).toStrictEqual([{ label: 'Amount', value: '1500000 (raw)' }]);
    });

    test('it presents degraded amounts through the formatDegraded option', () => {
        const options = { formatDegraded: (raw: string) => `${raw} (unscaled)` };
        expect(
            display({ data: data(field('amount', unresolved)) }, { data: { amount: 1_500_000n } }, options).fields,
        ).toStrictEqual([{ label: 'Amount', value: '1500000 (unscaled)' }]);
    });

    test('it marks degraded amounts within nested values', () => {
        const config = data(field('amount', unresolved), field('fee', u64));
        expect(
            display({ data: data(field('config', config)) }, { data: { config: { amount: 7n, fee: 5n } } }).fields,
        ).toStrictEqual([{ label: 'Config', value: 'Amount: 7 (raw), Fee: 5' }]);
    });

    test('it does not interpolate degraded values', () => {
        const instruction = {
            data: data(field('amount', unresolved)),
            display: instructionDisplayNode({ interpolatedIntent: 'Transfer ${data.amount}' }),
        };
        expect(display(instruction, { data: { amount: 7n } }).interpolatedIntent).toBeNull();
    });
});

describe('injected values', () => {
    const injectedAmount = amount({
        decimals: injectedValueNode({ key: 'decimals' }),
        unit: injectedValueNode({ key: 'unit' }),
    });

    test('it resolves literal values provided by the instruction', () => {
        const provides = [
            providedNode('decimals', integerValueNode('6')),
            providedNode('unit', stringValueNode('USDC')),
        ];
        const fields = display(
            { data: data(field('amount', injectedAmount)), provides },
            { data: { amount: 1_500_000n } },
        ).fields;
        expect(fields).toStrictEqual([{ label: 'Amount', value: '1.5 USDC' }]);
    });

    test('it resolves values provided from the instruction data', () => {
        const provides = [providedNode('decimals', dataValueNode('decimals'))];
        const instruction = {
            data: data(field('amount', injectedAmount), field('decimals', integerTypeNode('u8'))),
            provides,
        };
        expect(display(instruction, { data: { amount: 1_500_000n, decimals: 6 } }).fields).toStrictEqual([
            { label: 'Amount', value: '1.5' },
            { label: 'Decimals', value: '6' },
        ]);
    });

    test('it resolves units provided from the instruction data', () => {
        const provides = [
            providedNode('decimals', integerValueNode('6')),
            providedNode('unit', dataValueNode('symbol')),
        ];
        const instruction = {
            data: data(field('amount', injectedAmount), field('symbol', stringTypeNode('utf8'))),
            provides,
        };
        expect(display(instruction, { data: { amount: 1_500_000n, symbol: 'USDC' } }).fields[0]).toStrictEqual({
            label: 'Amount',
            value: '1.5 USDC',
        });
    });

    test('it formats address units provided from the instruction data with the address formatter', () => {
        const provides = [providedNode('decimals', integerValueNode('6')), providedNode('unit', dataValueNode('mint'))];
        const instruction = {
            data: data(field('amount', injectedAmount), field('mint', publicKeyTypeNode())),
            provides,
        };
        const fields = display(instruction, { data: { amount: 1_500_000n, mint: CAROL } }, { formatAddress }).fields;
        expect(fields[0]).toStrictEqual({ label: 'Amount', value: '1.5 Carol' });
    });

    test('it formats address units provided by accounts with the address formatter', () => {
        const provides = [
            providedNode('decimals', integerValueNode('6')),
            providedNode('unit', accountValueNode('mint')),
        ];
        const instruction = { accounts: [account('mint')], data: data(field('amount', injectedAmount)), provides };
        const fields = display(
            instruction,
            { accounts: [readonly(CAROL)], data: { amount: 1_500_000n } },
            { formatAddress },
        ).fields;
        expect(fields).toStrictEqual([
            { label: 'Amount', value: '1.5 Carol' },
            { label: 'Mint', value: 'Carol' },
        ]);
    });

    test('it formats address units provided by the program with the address formatter', () => {
        const unit = unitNumberDisplayNode({ unit: injectedValueNode({ key: 'unit' }) });
        const instruction = {
            data: data(field('count', integerTypeNode('u8', { display: unit }))),
            provides: [providedNode('unit', programIdValueNode())],
        };
        expect(
            display(instruction, { data: { count: 3 } }, { formatAddress: () => 'Token Program' }).fields,
        ).toStrictEqual([{ label: 'Count', value: '3 Token Program' }]);
    });

    test('it formats address units provided by linked programs with the address formatter', () => {
        const unit = unitNumberDisplayNode({ unit: injectedValueNode({ key: 'unit' }) });
        const instruction = {
            data: data(field('count', integerTypeNode('u8', { display: unit }))),
            provides: [providedNode('unit', programLinkNode('testProgram'))],
        };
        expect(
            display(instruction, { data: { count: 3 } }, { formatAddress: () => 'Test Program' }).fields,
        ).toStrictEqual([{ label: 'Count', value: '3 Test Program' }]);
    });

    test('it does not resolve units provided by optional accounts omitted with the program address', () => {
        const provides = [
            providedNode('decimals', integerValueNode('6')),
            providedNode('unit', accountValueNode('mint')),
        ];
        const instruction = {
            accounts: [account('mint', { isOptional: true })],
            data: data(field('amount', injectedAmount)),
            provides,
        };
        const fields = display(instruction, {
            accounts: [readonly(PROGRAM_ADDRESS)],
            data: { amount: 1_500_000n },
        }).fields;
        expect(fields).toStrictEqual([{ label: 'Amount', value: '1.5' }]);
    });

    test('it does not resolve values read from account data', () => {
        const provides = [providedNode('decimals', accountDataValueNode('mint', { path: 'decimals' }))];
        const instruction = {
            accounts: [account('mint', { accountLink: accountLinkNode('mint') })],
            data: data(field('amount', injectedAmount)),
            provides,
        };
        const mint = accountNode({ data: data(field('decimals', integerTypeNode('u8'))), identifier: 'mint' });
        const fields = display(
            instruction,
            { accounts: [readonly(CAROL)], data: { amount: 7n } },
            {},
            { accounts: [mint] },
        ).fields;
        expect(fields[0]).toStrictEqual({ label: 'Amount', value: '7 (raw)' });
    });
});

describe('accounts', () => {
    test('it shows a row per account, with its formatted address', () => {
        const instruction = {
            accounts: [
                account('source'),
                account('destination', { display: instructionAccountDisplayNode({ label: 'To' }) }),
            ],
        };
        expect(
            display(instruction, { accounts: [readonly(ALICE), readonly(BOB)] }, { formatAddress }).fields,
        ).toStrictEqual([
            { label: 'Source', value: 'Alice' },
            { label: 'To', value: 'Bob' },
        ]);
    });

    test('it leaves out accounts skipped always and omitted optional accounts', () => {
        const instruction = {
            accounts: [
                account('source', { display: instructionAccountDisplayNode({ skip: 'always' }) }),
                account('destination'),
                account('referrer', { isOptional: true }),
            ],
            optionalAccountStrategy: 'omitted' as const,
        };
        expect(display(instruction, { accounts: [readonly(ALICE), readonly(BOB)] }).fields).toStrictEqual([
            { label: 'Destination', value: BOB },
        ]);
    });

    test('it leaves out optional accounts omitted with the program address', () => {
        // Given an optional referrer omitted with the default programId strategy.
        const instruction = { accounts: [account('destination'), account('referrer', { isOptional: true })] };
        const fields = display(instruction, { accounts: [readonly(BOB), readonly(PROGRAM_ADDRESS)] }).fields;

        // Then it is not presented as a real account.
        expect(fields).toStrictEqual([{ label: 'Destination', value: BOB }]);
    });

    test('it shows required accounts holding the program address', () => {
        const instruction = { accounts: [account('program')] };
        expect(display(instruction, { accounts: [readonly(PROGRAM_ADDRESS)] }).fields).toStrictEqual([
            { label: 'Program', value: PROGRAM_ADDRESS },
        ]);
    });

    test('it shows optional accounts holding the program address with the omitted strategy', () => {
        const instruction = {
            accounts: [account('referrer', { isOptional: true })],
            optionalAccountStrategy: 'omitted' as const,
        };
        expect(display(instruction, { accounts: [readonly(PROGRAM_ADDRESS)] }).fields).toStrictEqual([
            { label: 'Referrer', value: PROGRAM_ADDRESS },
        ]);
    });

    test('it groups remaining accounts by signer role, numbering them', () => {
        const instruction = {
            accounts: [account('multisig')],
            remainingAccounts: [
                instructionRemainingAccountsNode('signers', { isSigner: true }),
                instructionRemainingAccountsNode('extras'),
            ],
        };
        const accounts = [readonly(ALICE), signer(BOB), signer(CAROL), readonly(ALICE)];
        expect(display(instruction, { accounts }, { formatAddress }).fields).toStrictEqual([
            { label: 'Multisig', value: 'Alice' },
            { label: 'Signers #1', value: 'Bob' },
            { label: 'Signers #2', value: 'Carol' },
            { label: 'Extras', value: 'Alice' },
        ]);
    });

    test('it shows remaining accounts of instructions declaring none', () => {
        expect(display({}, { accounts: [readonly(ALICE)] }, { formatAddress }).fields).toStrictEqual([
            { label: 'Remaining Account', value: 'Alice' },
        ]);
    });

    test('it leaves out remaining accounts skipped always', () => {
        const instruction = {
            remainingAccounts: [
                instructionRemainingAccountsNode('signers', {
                    display: instructionAccountDisplayNode({ skip: 'always' }),
                }),
            ],
        };
        expect(display(instruction, { accounts: [signer(BOB)] }).fields).toStrictEqual([]);
    });
});

describe('interpolated intent', () => {
    const intent = (interpolatedIntent: string) => instructionDisplayNode({ interpolatedIntent });

    test('it is null without a template', () => {
        expect(display({}).interpolatedIntent).toBeNull();
    });

    test('it fills placeholders with formatted values and addresses', () => {
        const instruction = {
            accounts: [account('destination')],
            data: data(field('amount', amount({ decimals: integerValueNode('6'), unit: stringValueNode('USDC') }))),
            display: intent('Transfer ${data.amount} to ${accounts.destination}'),
        };
        expect(
            display(instruction, { accounts: [readonly(BOB)], data: { amount: 1_500_000n } }, { formatAddress })
                .interpolatedIntent,
        ).toBe('Transfer 1.5 USDC to Bob');
    });

    test('it follows nested paths', () => {
        const config = data(field('fees', arrayTypeNode(u64, prefixedCountNode(integerTypeNode('u8')))));
        const instruction = { data: data(field('config', config)), display: intent('Fee: ${data.config.fees[1]}') };
        expect(display(instruction, { data: { config: { fees: [1n, 25n] } } }).interpolatedIntent).toBe('Fee: 25');
    });

    test('it is null when a placeholder refers to an omitted account', () => {
        const instruction = {
            accounts: [account('referrer', { isOptional: true })],
            display: intent('Refer ${accounts.referrer}'),
            optionalAccountStrategy: 'omitted' as const,
        };
        expect(display(instruction).interpolatedIntent).toBeNull();
    });

    test('it is null when a placeholder refers to an optional account omitted with the program address', () => {
        const instruction = {
            accounts: [account('referrer', { isOptional: true })],
            display: intent('Refer ${accounts.referrer}'),
        };
        expect(display(instruction, { accounts: [readonly(PROGRAM_ADDRESS)] }).interpolatedIntent).toBeNull();
    });

    test('it is null when a placeholder is empty', () => {
        const signers = field('signers', arrayTypeNode(publicKeyTypeNode(), prefixedCountNode(integerTypeNode('u8'))));
        const instruction = { data: data(signers), display: intent('Sign with ${data.signers}') };
        expect(display(instruction, { data: { signers: [] } }).interpolatedIntent).toBeNull();
    });

    test('it is null when a placeholder reads account data', () => {
        const mint = accountNode({ data: data(field('decimals', integerTypeNode('u8'))), identifier: 'mint' });
        const instruction = {
            accounts: [account('mint', { accountLink: accountLinkNode('mint') })],
            display: intent('Decimals: ${accounts.mint.data.decimals}'),
        };
        expect(
            display(instruction, { accounts: [readonly(CAROL)] }, {}, { accounts: [mint] }).interpolatedIntent,
        ).toBeNull();
    });

    test('it is null when a placeholder crosses an account link', () => {
        const mint = accountNode({ data: data(field('decimals', integerTypeNode('u8'))), identifier: 'mint' });
        const instruction = {
            data: data(field('mint', publicKeyTypeNode({ accountLink: accountLinkNode('mint') }))),
            display: intent('Decimals: ${data.mint.data.decimals}'),
        };
        expect(display(instruction, { data: { mint: CAROL } }, {}, { accounts: [mint] }).interpolatedIntent).toBeNull();
    });
});

test('it uses the given linkables rather than recording them', () => {
    // Given a field linking to an enum, labelled by value, and linkables that do not record the enum.
    const mode = definedTypeNode({ identifier: 'mode', type: enumTypeNode([enumVariantTypeNode('fast')]) });
    const labels = [valueLabelDisplayNode({ label: 'Quick', value: enumValueNode('mode', 'fast') })];
    const modeField = field('mode', definedTypeLinkNode('mode'), {
        display: structFieldDisplayNode({ valueLabels: labels }),
    });

    // Then the link cannot be resolved from them.
    expect(() =>
        display(
            { data: data(modeField) },
            { data: { mode: 'fast' } },
            { linkables: new LinkableDictionary() },
            { definedTypes: [mode] },
        ),
    ).toThrow(
        expect.objectContaining({ context: expect.objectContaining({ __code: CODAMA_ERROR__LINKED_NODE_NOT_FOUND }) }),
    );
});

function structValue(fee: bigint) {
    return structValueNode([structFieldValueNode('fee', integerValueNode(fee.toString()))]);
}
