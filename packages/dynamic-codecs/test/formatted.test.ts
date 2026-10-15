import {
    CODAMA_ERROR__LINKED_NODE_NOT_FOUND,
    CODAMA_ERROR__UNEXPECTED_NODE_KIND,
    CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE,
    CodamaError,
} from '@codama/errors';
import {
    accountNode,
    amountNumberDisplayNode,
    arrayTypeNode,
    booleanTypeNode,
    bytesTypeNode,
    dateTimeTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    durationTypeNode,
    enumTypeNode,
    enumValueNode,
    enumVariantDisplayNode,
    enumVariantTypeNode,
    fixedCountNode,
    fixedPointTypeNode,
    floatTypeNode,
    injectedValueNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    mapTypeNode,
    optionTypeNode,
    prefixedCountNode,
    programNode,
    providedNode,
    publicKeyTypeNode,
    rootNode,
    setTypeNode,
    stringTypeNode,
    stringValueNode,
    structFieldDisplayNode,
    structFieldTypeNode,
    structFieldValueNode,
    structTypeNode,
    structValueNode,
    textNode,
    tupleTypeNode,
    valueLabelDisplayNode,
    zeroableOptionTypeNode,
} from '@codama/nodes';
import { getLastNodeFromPath, LinkableDictionary, ProvidedScope } from '@codama/visitors-core';
import { address, getAddressEncoder } from '@solana/addresses';
import { getUtf8Encoder } from '@solana/codecs';
import { describe, expect, expectTypeOf, test } from 'vitest';

import {
    assertIsDecodedNode,
    assertIsFormattedNode,
    DecodedNode,
    formatDecodedNode,
    FormattedIntegerTypeNode,
    FormattedNode,
    FormattedStructTypeNode,
    GetFormattedNodeFromDecoded,
    getFormattedRows,
    getNodeCodec,
    isDecodedNode,
    isFormattedNode,
} from '../src';
import { hex } from './_setup';

const ALICE = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const u8 = integerTypeNode('u8');

describe('leaves', () => {
    test('it formats integers', () => {
        const decoded = getNodeCodec([integerTypeNode('u32', { unit: 'slots' })]).decode(hex('2a000000'));
        expect(formatDecodedNode(decoded)).toStrictEqual({ ...decoded, degraded: false, text: '42 slots' });
    });

    test('it formats integers with an override', () => {
        const decoded = getNodeCodec([u8]).decode(hex('2a'));
        expect(formatDecodedNode(decoded, { formatInteger: integer => `#${integer.value}` }).text).toBe('#42');
    });

    test('it formats amounts whose decimals cannot be resolved as their raw value', () => {
        const display = amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) });
        const decoded = getNodeCodec([integerTypeNode('u32', { display })]).decode(hex('60e31600'));
        expect(formatDecodedNode(decoded)).toMatchObject({ degraded: true, text: '1500000' });
    });

    test('it formats booleans with an override', () => {
        const decoded = getNodeCodec([booleanTypeNode()]).decode(hex('01'));
        expect(formatDecodedNode(decoded, { formatBoolean: boolean => (boolean.value ? 'Yes' : 'No') }).text).toBe(
            'Yes',
        );
    });

    test('it formats bytes with an override', () => {
        const decoded = getNodeCodec([bytesTypeNode()]).decode(hex('0102'));
        expect(formatDecodedNode(decoded, { formatBytes: bytes => bytes.value[0] }).text).toBe('base64');
    });

    test('it formats date-times with an override', () => {
        const decoded = getNodeCodec([dateTimeTypeNode(integerTypeNode('i64'))]).decode(hex('8000926500000000'));
        expect(formatDecodedNode(decoded).text).toBe('2024-01-01T00:00:00Z');
        expect(formatDecodedNode(decoded, { formatDateTime: () => '01/01/2024' }).text).toBe('01/01/2024');
    });

    test('it formats durations with an override', () => {
        const decoded = getNodeCodec([durationTypeNode(integerTypeNode('u32'))]).decode(hex('18150000'));
        expect(formatDecodedNode(decoded).text).toBe('01:30:00');
        expect(formatDecodedNode(decoded, { formatDuration: () => '90 minutes' }).text).toBe('90 minutes');
    });

    test('it formats fixed points with an override', () => {
        const decoded = getNodeCodec([fixedPointTypeNode(integerTypeNode('u32'), { scale: 2 })]).decode(
            hex('39300000'),
        );
        expect(formatDecodedNode(decoded).text).toBe('123.45');
        expect(formatDecodedNode(decoded, { formatFixedPoint: () => 'about 123' }).text).toBe('about 123');
    });

    test('it formats floats with an override', () => {
        const decoded = getNodeCodec([floatTypeNode('f32')]).decode(hex('0000c03f'));
        expect(formatDecodedNode(decoded).text).toBe('1.5');
        expect(formatDecodedNode(decoded, { formatFloat: () => 'one and a half' }).text).toBe('one and a half');
    });

    test('it formats strings with an override', () => {
        const decoded = getNodeCodec([stringTypeNode('utf8')]).decode(getUtf8Encoder().encode('hi'));
        expect(formatDecodedNode(decoded).text).toBe('hi');
        expect(formatDecodedNode(decoded, { formatString: string => `"${string.value}"` }).text).toBe('"hi"');
    });

    test('it formats public keys with the address formatter', () => {
        const decoded = getNodeCodec([publicKeyTypeNode()]).decode(getAddressEncoder().encode(ALICE));
        expect(formatDecodedNode(decoded).text).toBe(ALICE);
        expect(formatDecodedNode(decoded, { formatAddress: () => 'Alice' }).text).toBe('Alice');
    });

    test('it passes options to the formatters', () => {
        const decoded = getNodeCodec([integerTypeNode('u32')]).decode(hex('87d61200'));
        expect(formatDecodedNode(decoded, { numberFormat: new Intl.NumberFormat('en-US') }).text).toBe('1,234,567');
    });
});

describe('structs', () => {
    test('it formats structs as their labelled fields', () => {
        const node = structTypeNode([
            structFieldTypeNode({ identifier: 'amount', type: u8 }),
            structFieldTypeNode({ identifier: 'maxFee', type: u8 }),
        ]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('2a07')));
        expect(formatted.text).toBe('Amount: 42, Max Fee: 7');
    });

    test('it formats struct fields as the text of their type, with their display attributes', () => {
        const display = structFieldDisplayNode({ label: textNode({ content: 'Fee' }), skip: 'whenInjected' });
        const node = structTypeNode([structFieldTypeNode({ display, identifier: 'maxFee', type: u8 })]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('07')));
        expect(formatted.fields[0]).toMatchObject({
            flatten: false,
            flattenPrefix: '',
            label: 'Fee',
            skip: 'whenInjected',
            text: '7',
            type: { text: '7' },
        });
    });

    test('it defaults the display attributes of struct fields', () => {
        const node = structTypeNode([structFieldTypeNode({ identifier: 'maxFee', type: u8 })]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('07')));
        expect(formatted.fields[0]).toMatchObject({
            flatten: false,
            flattenPrefix: '',
            label: 'Max Fee',
            skip: 'never',
        });
    });

    test('it keeps fields skipped always in the tree but leaves them out of the text', () => {
        const node = structTypeNode([
            structFieldTypeNode({
                display: structFieldDisplayNode({ skip: 'always' }),
                identifier: 'discriminator',
                type: u8,
            }),
            structFieldTypeNode({ identifier: 'amount', type: u8 }),
        ]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('032a')));
        expect(formatted.text).toBe('Amount: 42');
        expect(formatted.fields.map(field => field.label)).toStrictEqual(['Discriminator', 'Amount']);
    });

    test('it wraps nested structs in parentheses', () => {
        const config = structTypeNode([
            structFieldTypeNode({ identifier: 'fee', type: u8 }),
            structFieldTypeNode({ identifier: 'admin', type: publicKeyTypeNode() }),
        ]);
        const node = structTypeNode([
            structFieldTypeNode({ identifier: 'amount', type: u8 }),
            structFieldTypeNode({ identifier: 'config', type: config }),
        ]);
        const bytes = new Uint8Array([0x2a, 0x19, ...getAddressEncoder().encode(ALICE)]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(bytes), { formatAddress: () => 'Alice' });
        expect(formatted.text).toBe('Amount: 42, Config: (Fee: 25, Admin: Alice)');
        expect(formatted.fields[1].text).toBe('Fee: 25, Admin: Alice');
    });

    test('it lifts the fields of flattened structs into the text of their parent', () => {
        const config = structTypeNode([structFieldTypeNode({ identifier: 'fee', type: u8 })]);
        const node = structTypeNode([
            structFieldTypeNode({ identifier: 'amount', type: u8 }),
            structFieldTypeNode({
                display: structFieldDisplayNode({ flatten: true }),
                identifier: 'config',
                type: config,
            }),
        ]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('2a19')));
        expect(formatted.text).toBe('Amount: 42, Fee: 25');
        expect(formatted.fields[1]).toMatchObject({ flatten: true, text: 'Fee: 25' });
    });

    test('it prefixes the labels of flattened fields', () => {
        const display = structFieldDisplayNode({ flatten: true, flattenPrefix: 'config.' });
        const config = structTypeNode([structFieldTypeNode({ identifier: 'fee', type: u8 })]);
        const node = structTypeNode([structFieldTypeNode({ display, identifier: 'config', type: config })]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('19')));
        expect(formatted.text).toBe('config.Fee: 25');
        expect(formatted.fields[0].flattenPrefix).toBe('config.');
    });

    test('it combines the prefixes of nested flattened fields', () => {
        const flatten = (flattenPrefix: string) => structFieldDisplayNode({ flatten: true, flattenPrefix });
        const inner = structTypeNode([structFieldTypeNode({ identifier: 'fee', type: u8 })]);
        const outer = structTypeNode([
            structFieldTypeNode({ display: flatten('b.'), identifier: 'inner', type: inner }),
        ]);
        const node = structTypeNode([
            structFieldTypeNode({ display: flatten('a.'), identifier: 'outer', type: outer }),
        ]);
        expect(formatDecodedNode(getNodeCodec([node]).decode(hex('19'))).text).toBe('a.b.Fee: 25');
    });

    test('it ignores flatten on fields that are not structs', () => {
        const display = structFieldDisplayNode({ flatten: true });
        const node = structTypeNode([structFieldTypeNode({ display, identifier: 'amount', type: u8 })]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('2a')));
        expect(formatted.text).toBe('Amount: 42');
        expect(formatted.fields[0].flatten).toBe(false);
    });

    test('it formats empty structs as empty text', () => {
        const formatted = formatDecodedNode(getNodeCodec([structTypeNode([])]).decode(hex('')));
        expect(formatted.text).toBe('');
    });
});

describe('rows', () => {
    test('it lays out structs as one row per field', () => {
        const node = structTypeNode([
            structFieldTypeNode({ identifier: 'amount', type: u8 }),
            structFieldTypeNode({ identifier: 'maxFee', type: u8 }),
        ]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('2a07')));
        expect(getFormattedRows(formatted)).toStrictEqual([
            { field: formatted.fields[0], identifiers: ['amount'], label: 'Amount', text: '42' },
            { field: formatted.fields[1], identifiers: ['maxFee'], label: 'Max Fee', text: '7' },
        ]);
    });

    test('it presents containers without wrapping them in parentheses', () => {
        const node = structTypeNode([
            structFieldTypeNode({ identifier: 'items', type: arrayTypeNode(u8, fixedCountNode(2)) }),
        ]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('0102')));
        expect(getFormattedRows(formatted).map(row => row.text)).toStrictEqual(['1, 2']);
    });

    test('it leaves out fields skipped always', () => {
        const node = structTypeNode([
            structFieldTypeNode({
                display: structFieldDisplayNode({ skip: 'always' }),
                identifier: 'discriminator',
                type: u8,
            }),
            structFieldTypeNode({ identifier: 'amount', type: u8 }),
        ]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('032a')));
        expect(getFormattedRows(formatted).map(row => row.label)).toStrictEqual(['Amount']);
    });

    test('it keeps fields skipped when injected', () => {
        const display = structFieldDisplayNode({ skip: 'whenInjected' });
        const node = structTypeNode([structFieldTypeNode({ display, identifier: 'decimals', type: u8 })]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('06')));
        expect(getFormattedRows(formatted)).toMatchObject([{ field: { skip: 'whenInjected' }, label: 'Decimals' }]);
    });

    test('it replaces flattened fields by the rows of their fields, with their combined prefixes', () => {
        const flatten = (flattenPrefix: string) => structFieldDisplayNode({ flatten: true, flattenPrefix });
        const inner = structTypeNode([structFieldTypeNode({ identifier: 'fee', type: u8 })]);
        const outer = structTypeNode([
            structFieldTypeNode({ display: flatten('b.'), identifier: 'inner', type: inner }),
            structFieldTypeNode({ identifier: 'admin', type: u8 }),
        ]);
        const node = structTypeNode([
            structFieldTypeNode({ display: flatten('a.'), identifier: 'outer', type: outer }),
            structFieldTypeNode({ identifier: 'amount', type: u8 }),
        ]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('19012a')));
        expect(
            getFormattedRows(formatted).map(({ identifiers, label, text }) => [identifiers, label, text]),
        ).toStrictEqual([
            [['outer', 'inner', 'fee'], 'a.b.Fee', '25'],
            [['outer', 'admin'], 'a.Admin', '1'],
            [['amount'], 'Amount', '42'],
        ]);
    });

    test('it presents fields matching a value label as their label, without flattening them', () => {
        const config = structTypeNode([structFieldTypeNode({ identifier: 'fee', type: u8 })]);
        const display = structFieldDisplayNode({
            flatten: true,
            valueLabels: [
                valueLabelDisplayNode({
                    label: textNode({ content: 'Free' }),
                    value: structValueNode([structFieldValueNode('fee', integerValueNode('0'))]),
                }),
            ],
        });
        const node = structTypeNode([structFieldTypeNode({ display, identifier: 'config', type: config })]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('00')));
        expect(getFormattedRows(formatted).map(({ label, text }) => [label, text])).toStrictEqual([['Config', 'Free']]);
    });
});

describe('lists, sets, tuples and maps', () => {
    test('it formats arrays as their items', () => {
        const decoded = getNodeCodec([arrayTypeNode(u8, fixedCountNode(3))]).decode(hex('010203'));
        const formatted = formatDecodedNode(decoded);
        expect(formatted.text).toBe('1, 2, 3');
        expect(formatted.items.map(item => item.text)).toStrictEqual(['1', '2', '3']);
    });

    test('it formats empty containers within containers as empty parentheses', () => {
        const node = structTypeNode([
            structFieldTypeNode({ identifier: 'items', type: arrayTypeNode(u8, prefixedCountNode(u8)) }),
        ]);
        expect(formatDecodedNode(getNodeCodec([node]).decode(hex('00'))).text).toBe('Items: ()');
    });

    test('it formats empty arrays as empty text', () => {
        const decoded = getNodeCodec([arrayTypeNode(u8, prefixedCountNode(u8))]).decode(hex('00'));
        expect(formatDecodedNode(decoded).text).toBe('');
    });

    test('it formats sets as their items', () => {
        const decoded = getNodeCodec([setTypeNode(u8, fixedCountNode(2))]).decode(hex('0102'));
        expect(formatDecodedNode(decoded).text).toBe('1, 2');
    });

    test('it formats tuples as their items', () => {
        const node = tupleTypeNode([u8, booleanTypeNode()]);
        expect(formatDecodedNode(getNodeCodec([node]).decode(hex('2a01'))).text).toBe('42, true');
    });

    test('it wraps nested lists in parentheses', () => {
        const node = arrayTypeNode(arrayTypeNode(u8, fixedCountNode(2)), fixedCountNode(2));
        expect(formatDecodedNode(getNodeCodec([node]).decode(hex('01020304'))).text).toBe('(1, 2), (3, 4)');
    });

    test('it formats maps as their entries', () => {
        const node = mapTypeNode(u8, u8, fixedCountNode(2));
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('010a0205')));
        expect(formatted.text).toBe('1: 10, 2: 5');
        expect(formatted.entries.map(([key, value]) => [key.text, value.text])).toStrictEqual([
            ['1', '10'],
            ['2', '5'],
        ]);
    });
});

describe('options', () => {
    test('it formats some options as their item', () => {
        const formatted = formatDecodedNode(getNodeCodec([optionTypeNode(u8)]).decode(hex('012a')));
        expect(formatted.text).toBe('42');
        expect(formatted.item?.text).toBe('42');
    });

    test('it formats none options as None', () => {
        const formatted = formatDecodedNode(getNodeCodec([optionTypeNode(u8)]).decode(hex('00')));
        expect(formatted.text).toBe('None');
        expect(formatted).not.toHaveProperty('item');
    });

    test('it formats zeroable options', () => {
        const formatted = formatDecodedNode(getNodeCodec([zeroableOptionTypeNode(u8)]).decode(hex('00')));
        expect(formatted.text).toBe('None');
    });

    test('it wraps options of containers within containers in parentheses', () => {
        const config = structTypeNode([structFieldTypeNode({ identifier: 'fee', type: u8 })]);
        const node = structTypeNode([structFieldTypeNode({ identifier: 'config', type: optionTypeNode(config) })]);
        expect(formatDecodedNode(getNodeCodec([node]).decode(hex('0119'))).text).toBe('Config: (Fee: 25)');
    });
});

describe('enums', () => {
    const order = enumTypeNode([
        enumVariantTypeNode('market'),
        enumVariantTypeNode('limitOrder', {
            data: structTypeNode([
                structFieldTypeNode({ identifier: 'price', type: u8 }),
                structFieldTypeNode({ identifier: 'size', type: u8 }),
            ]),
        }),
    ]);

    test('it formats enums without data as the label of their variant', () => {
        const formatted = formatDecodedNode(getNodeCodec([order]).decode(hex('00')));
        expect(formatted.text).toBe('Market');
        expect(formatted.variant).toMatchObject({ label: 'Market', skipInnerData: false, text: 'Market' });
    });

    test('it formats enums with data as the label of their variant followed by their data', () => {
        const formatted = formatDecodedNode(getNodeCodec([order]).decode(hex('016405')));
        expect(formatted.text).toBe('Limit Order (Price: 100, Size: 5)');
        expect(formatted.variant.data?.text).toBe('Price: 100, Size: 5');
    });

    test('it formats the label of enum variants with an override', () => {
        const formatted = formatDecodedNode(getNodeCodec([order]).decode(hex('016405')), {
            formatEnum: enumValue => enumValue.value.__kind,
        });
        expect(formatted.text).toBe('limitOrder (Price: 100, Size: 5)');
    });

    test('it leaves the data of variants that skip it out of their text', () => {
        const display = enumVariantDisplayNode({ label: 'Limit', skipInnerData: true });
        const node = enumTypeNode([enumVariantTypeNode('limitOrder', { data: u8, display })]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('0064')));
        expect(formatted.text).toBe('Limit');
        expect(formatted.variant).toMatchObject({ data: { text: '100' }, skipInnerData: true });
    });

    test('it formats enum variants on their own with the same default label as their enum', () => {
        const display = enumVariantDisplayNode({ label: 'Move' });
        const node = enumTypeNode([enumVariantTypeNode('moveTo', { display })]);
        const decoded = getNodeCodec([node]).decode(hex('00'));
        expect(formatDecodedNode(decoded.variant).label).toBe(formatDecodedNode(decoded).variant.label);
        expect(formatDecodedNode(decoded.variant).label).toBe('Move');
    });

    test('it formats enum variants on their own', () => {
        const variant = enumVariantTypeNode('moveTo', { data: u8 });
        const formatted = formatDecodedNode(getNodeCodec([enumTypeNode([variant])]).decode(hex('0005')));
        expect(formatted.variant).toMatchObject({ label: 'Move To', text: 'Move To (5)' });
    });
});

describe('degraded nodes', () => {
    const amount = integerTypeNode('u32', {
        display: amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) }),
    });

    test('it propagates degraded nodes to their parents', () => {
        const node = structTypeNode([
            structFieldTypeNode({ identifier: 'amounts', type: arrayTypeNode(amount, fixedCountNode(1)) }),
        ]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('60e31600')));
        expect(formatted).toMatchObject({ degraded: true, text: 'Amounts: (1500000)' });
        expect(formatted.fields[0]).toMatchObject({ degraded: true, type: { degraded: true } });
    });

    test('it does not propagate degraded nodes left out of the text of their parent', () => {
        const node = structTypeNode([
            structFieldTypeNode({
                display: structFieldDisplayNode({ skip: 'always' }),
                identifier: 'amount',
                type: amount,
            }),
        ]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('60e31600')));
        expect(formatted.degraded).toBe(false);
        expect(formatted.fields[0].degraded).toBe(true);
    });

    test('it presents degraded integers through the formatDegraded option', () => {
        const node = structTypeNode([structFieldTypeNode({ identifier: 'amount', type: amount })]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('60e31600')), {
            formatDegraded: raw => `${raw} (raw)`,
        });
        expect(formatted).toMatchObject({ degraded: true, text: 'Amount: 1500000 (raw)' });
        expect(formatted.fields[0].type).toMatchObject({ degraded: true, text: '1500000 (raw)' });
    });

    test('it gives formatDegraded the raw value and the decoded node', () => {
        const decoded = getNodeCodec([amount]).decode(hex('60e31600'));
        const calls: unknown[] = [];
        formatDecodedNode(decoded, { formatDegraded: (...args) => (calls.push(args), '') });
        expect(calls).toStrictEqual([['1500000', decoded]]);
    });

    test('it does not use formatDegraded for integers that can be formatted', () => {
        const formatted = formatDecodedNode(getNodeCodec([u8]).decode(hex('2a')), { formatDegraded: () => 'raw' });
        expect(formatted.text).toBe('42');
    });

    test('it does not degrade nodes whose amounts can be resolved', () => {
        const display = amountNumberDisplayNode({ decimals: integerValueNode('6'), unit: stringValueNode('USDC') });
        const node = structTypeNode([
            structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u32', { display }) }),
        ]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('60e31600')));
        expect(formatted).toMatchObject({ degraded: false, text: 'Amount: 1.5 USDC' });
    });
});

describe('injected values', () => {
    const decimals = injectedValueNode({ key: 'decimals' });
    const amount = integerTypeNode('u32', { display: amountNumberDisplayNode({ decimals }) });
    const amountField = (identifier: string) => structFieldTypeNode({ identifier, type: amount });

    test('it gives the resolver the decoded nodes containing the value', () => {
        const node = structTypeNode([
            structFieldTypeNode({ identifier: 'config', type: structTypeNode([amountField('fee')]) }),
        ]);
        const decoded = getNodeCodec([node]).decode(hex('60e31600'));
        const parents: unknown[] = [];
        formatDecodedNode(decoded, {
            resolveInjectedValue: (_, nodeParents) => (parents.push(nodeParents), undefined),
        });
        const config = decoded.fields[0];
        assertIsDecodedNode(config.type, 'structTypeNode');
        expect(parents).toStrictEqual([[decoded, config, config.type, config.type.fields[0]]]);
    });

    test('it tells apart values whose types link to the same defined type', () => {
        // Given two fields linking to the same defined type, whose decoded paths are the same.
        const amounts = definedTypeNode({ identifier: 'amounts', type: structTypeNode([amountField('value')]) });
        const node = structTypeNode([
            structFieldTypeNode({ identifier: 'from', type: definedTypeLinkNode('amounts') }),
            structFieldTypeNode({ identifier: 'to', type: definedTypeLinkNode('amounts') }),
        ]);
        const root = rootNode(programNode({ definedTypes: [amounts], identifier: 'myProgram', publicKey: '1111' }));
        const decoded = getNodeCodec([root, root.program, node]).decode(hex('0100000002000000'));

        // Then the resolver receives the fields containing each value.
        const fields: string[][] = [];
        formatDecodedNode(decoded, {
            resolveInjectedValue: (_, parents) => {
                fields.push(
                    parents.flatMap(parent =>
                        isDecodedNode(parent, 'structFieldTypeNode')
                            ? [getLastNodeFromPath(parent.path).identifier]
                            : [],
                    ),
                );
                return undefined;
            },
        });
        expect(fields).toStrictEqual([
            ['from', 'value'],
            ['to', 'value'],
        ]);
    });

    test('it resolves values provided by the instruction within linked defined types', () => {
        const config = definedTypeNode({ identifier: 'config', type: structTypeNode([amountField('fee')]) });
        const instruction = instructionNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'config', type: definedTypeLinkNode('config') })]),
            identifier: 'configure',
            provides: [providedNode('decimals', integerValueNode('6'))],
        });
        const root = rootNode(
            programNode({
                definedTypes: [config],
                identifier: 'myProgram',
                instructions: [instruction],
                publicKey: '1111',
            }),
        );
        const formatted = formatDecodedNode(getNodeCodec([root, root.program, instruction]).decode(hex('60e31600')));
        expect(formatted.text).toBe('Config: (Fee: 1.5)');
    });

    test('it resolves values from the given scope', () => {
        const scope = new ProvidedScope([providedNode('decimals', integerValueNode('6'))]);
        const formatted = formatDecodedNode(getNodeCodec([amount]).decode(hex('60e31600')), { scope });
        expect(formatted.text).toBe('1.5');
    });

    test('it throws when an instruction provides a node that is not an instruction input', () => {
        const instruction = instructionNode({
            data: structTypeNode([amountField('amount')]),
            identifier: 'transfer',
            provides: [providedNode('decimals', u8)],
        });
        const root = rootNode(programNode({ identifier: 'myProgram', instructions: [instruction], publicKey: '1111' }));
        const decoded = getNodeCodec([root, root.program, instruction]).decode(hex('60e31600'));
        expect(() => formatDecodedNode(decoded)).toThrow(
            expect.objectContaining({
                context: expect.objectContaining({ __code: CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE }),
            }),
        );
    });
});

describe('accounts and instructions', () => {
    test('it formats accounts as their data', () => {
        const account = accountNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'amount', type: u8 })]),
            identifier: 'token',
        });
        const root = rootNode(programNode({ accounts: [account], identifier: 'myProgram', publicKey: '1111' }));
        const formatted = formatDecodedNode(getNodeCodec([root, root.program, account]).decode(hex('2a')));
        expect(formatted.text).toBe('Amount: 42');
        expect(formatted.data.text).toBe('Amount: 42');
    });

    test('it resolves the injected values of instructions from their provided value nodes', () => {
        const display = amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) });
        const instruction = instructionNode({
            data: structTypeNode([
                structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u32', { display }) }),
            ]),
            identifier: 'transfer',
            provides: [providedNode('decimals', integerValueNode('6'))],
        });
        const root = rootNode(programNode({ identifier: 'myProgram', instructions: [instruction], publicKey: '1111' }));
        const formatted = formatDecodedNode(getNodeCodec([root, root.program, instruction]).decode(hex('60e31600')));
        expect(formatted).toMatchObject({ degraded: false, text: 'Amount: 1.5' });
    });

    test('it formats instructions without data as empty text', () => {
        const instruction = instructionNode({ identifier: 'close' });
        const root = rootNode(programNode({ identifier: 'myProgram', instructions: [instruction], publicKey: '1111' }));
        const formatted = formatDecodedNode(getNodeCodec([root, root.program, instruction]).decode(hex('')));
        expect(formatted).toMatchObject({ degraded: false, text: '' });
        expect(formatted).not.toHaveProperty('data');
    });
});

describe('formatted nodes', () => {
    test('they are decoded nodes', () => {
        const node = structTypeNode([structFieldTypeNode({ identifier: 'amount', type: u8 })]);
        const decoded = getNodeCodec([node]).decode(hex('2a'));
        const formatted = formatDecodedNode(decoded);
        expect(formatted).toMatchObject({ path: decoded.path, postOffset: 1, preOffset: 0, value: { amount: 42n } });
        expect(isDecodedNode(formatted, 'structTypeNode')).toBe(true);
        expectTypeOf(formatted).toExtend<DecodedNode>();
    });

    test('they are typed after the decoded node they format', () => {
        expectTypeOf<GetFormattedNodeFromDecoded<DecodedNode<typeof u8>>>().toEqualTypeOf<FormattedIntegerTypeNode>();
        expectTypeOf<FormattedNode<ReturnType<typeof structTypeNode>>>().toEqualTypeOf<FormattedStructTypeNode>();
        expectTypeOf<GetFormattedNodeFromDecoded<DecodedNode>>().toEqualTypeOf<FormattedNode>();
    });

    test('it narrows formatted nodes by kind', () => {
        const formatted: FormattedNode = formatDecodedNode(getNodeCodec([u8]).decode(hex('2a')));
        expect(isFormattedNode(formatted, 'integerTypeNode')).toBe(true);
        expect(isFormattedNode(formatted, 'structTypeNode')).toBe(false);
    });

    test('it asserts the kind of formatted nodes', () => {
        const formatted: FormattedNode = formatDecodedNode(getNodeCodec([u8]).decode(hex('2a')));
        expect(() => assertIsFormattedNode(formatted, 'structTypeNode')).toThrow(
            new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                expectedKinds: ['structTypeNode'],
                kind: 'integerTypeNode',
                node: u8,
            }),
        );
    });
});

describe('value labels', () => {
    const u64 = integerTypeNode('u64');
    const unlimited = valueLabelDisplayNode({ label: 'Unlimited', value: integerValueNode('18446744073709551615') });
    const limit = structFieldTypeNode({
        display: structFieldDisplayNode({ valueLabels: [unlimited] }),
        identifier: 'limit',
        type: u64,
    });
    const max = 'ffffffffffffffff';

    test('it presents the value label of fields matching it', () => {
        const formatted = formatDecodedNode(getNodeCodec([structTypeNode([limit])]).decode(hex(max)));
        expect(formatted.fields[0]).toMatchObject({
            text: 'Unlimited',
            type: { text: '18446744073709551615' },
            valueLabel: 'Unlimited',
        });
        expect(formatted.text).toBe('Limit: Unlimited');
    });

    test('it presents the formatted value of fields not matching one', () => {
        const formatted = formatDecodedNode(getNodeCodec([structTypeNode([limit])]).decode(hex('2a00000000000000')));
        expect(formatted.fields[0].text).toBe('42');
        expect(formatted.fields[0]).not.toHaveProperty('valueLabel');
    });

    test('it presents the value labels of nested fields', () => {
        const node = structTypeNode([structFieldTypeNode({ identifier: 'config', type: structTypeNode([limit]) })]);
        expect(formatDecodedNode(getNodeCodec([node]).decode(hex(max))).text).toBe('Config: (Limit: Unlimited)');
    });

    test('it does not flatten fields presenting a value label', () => {
        const defaults = valueLabelDisplayNode({
            label: 'Default config',
            value: structValueNode([structFieldValueNode('limit', integerValueNode('0'))]),
        });
        const display = structFieldDisplayNode({ flatten: true, valueLabels: [defaults] });
        const node = structTypeNode([
            structFieldTypeNode({ display, identifier: 'config', type: structTypeNode([limit]) }),
        ]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('0000000000000000')));
        expect(formatted.fields[0]).toMatchObject({ flatten: false, text: 'Default config' });
        expect(formatted.text).toBe('Config: Default config');
    });

    test('it resolves values injected into labelled fields within linked defined types', () => {
        // Given a labelled field within a linked defined type, whose fee defaults to a value the instruction provides.
        const settings = structTypeNode([
            structFieldTypeNode({ identifier: 'enabled', type: u8 }),
            structFieldTypeNode({ defaultValue: injectedValueNode({ key: 'fee' }), identifier: 'fee', type: u8 }),
        ]);
        const defaults = valueLabelDisplayNode({
            label: 'Default settings',
            value: structValueNode([structFieldValueNode('enabled', integerValueNode('1'))]),
        });
        const config = definedTypeNode({
            identifier: 'config',
            type: structTypeNode([
                structFieldTypeNode({
                    display: structFieldDisplayNode({ valueLabels: [defaults] }),
                    identifier: 'settings',
                    type: settings,
                }),
            ]),
        });
        const instruction = instructionNode({
            data: structTypeNode([structFieldTypeNode({ identifier: 'config', type: definedTypeLinkNode('config') })]),
            identifier: 'configure',
            provides: [providedNode('fee', integerValueNode('5'))],
        });
        const root = rootNode(
            programNode({
                definedTypes: [config],
                identifier: 'myProgram',
                instructions: [instruction],
                publicKey: '1111',
            }),
        );

        // Then the label value uses the provided fee, and matches.
        const formatted = formatDecodedNode(getNodeCodec([root, root.program, instruction]).decode(hex('0105')));
        expect(formatted.text).toBe('Config: (Settings: Default settings)');
    });

    test('it does not degrade fields presenting a value label', () => {
        // Given an amount whose decimals cannot be resolved, labelled when unlimited.
        const display = amountNumberDisplayNode({ decimals: injectedValueNode({ key: 'decimals' }) });
        const amount = structFieldTypeNode({
            display: structFieldDisplayNode({ valueLabels: [unlimited] }),
            identifier: 'amount',
            type: integerTypeNode('u64', { display }),
        });

        // Then the label is presented with confidence.
        const formatted = formatDecodedNode(getNodeCodec([structTypeNode([amount])]).decode(hex(max)));
        expect(formatted.fields[0]).toMatchObject({ degraded: false, text: 'Unlimited' });
        expect(formatted.degraded).toBe(false);
    });

    test('it uses the given linkables rather than recording them', () => {
        // Given a field linking to an enum, labelled by variant.
        const mode = definedTypeNode({ identifier: 'mode', type: enumTypeNode([enumVariantTypeNode('fast')]) });
        const labels = [valueLabelDisplayNode({ label: 'Quick', value: enumValueNode('mode', 'fast') })];
        const field = structFieldTypeNode({
            display: structFieldDisplayNode({ valueLabels: labels }),
            identifier: 'mode',
            type: definedTypeLinkNode('mode'),
        });
        const node = structTypeNode([field]);
        const root = rootNode(programNode({ definedTypes: [mode], identifier: 'myProgram', publicKey: '1111' }));
        const decoded = getNodeCodec([root, root.program, node]).decode(hex('00'));

        // Then the label matches by default, and the given linkables are used otherwise.
        expect(formatDecodedNode(decoded).text).toBe('Mode: Quick');
        expect(() => formatDecodedNode(decoded, { linkables: new LinkableDictionary() })).toThrow(
            expect.objectContaining({
                context: expect.objectContaining({ __code: CODAMA_ERROR__LINKED_NODE_NOT_FOUND }),
            }),
        );
    });
});
