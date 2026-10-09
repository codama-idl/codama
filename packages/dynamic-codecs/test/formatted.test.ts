import { CODAMA_ERROR__UNEXPECTED_NODE_KIND, CodamaError } from '@codama/errors';
import {
    accountNode,
    amountNumberDisplayNode,
    arrayTypeNode,
    booleanTypeNode,
    bytesTypeNode,
    dateTimeTypeNode,
    durationTypeNode,
    enumTypeNode,
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
    publicKeyTypeNode,
    rootNode,
    setTypeNode,
    stringTypeNode,
    stringValueNode,
    structFieldDisplayNode,
    structFieldTypeNode,
    structTypeNode,
    textNode,
    tupleTypeNode,
    zeroableOptionTypeNode,
} from '@codama/nodes';
import { address, getAddressEncoder } from '@solana/addresses';
import { getUtf8Encoder } from '@solana/codecs';
import { describe, expect, expectTypeOf, test } from 'vitest';

import {
    assertIsFormattedNode,
    DecodedNode,
    FormattedIntegerTypeNode,
    FormattedNode,
    FormattedStructTypeNode,
    formatDecodedNode,
    GetFormattedNodeFromDecoded,
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
        const decoded = getNodeCodec([fixedPointTypeNode(integerTypeNode('u32'), 2)]).decode(hex('39300000'));
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

    test('it does not degrade nodes whose amounts can be resolved', () => {
        const display = amountNumberDisplayNode({ decimals: integerValueNode('6'), unit: stringValueNode('USDC') });
        const node = structTypeNode([
            structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u32', { display }) }),
        ]);
        const formatted = formatDecodedNode(getNodeCodec([node]).decode(hex('60e31600')));
        expect(formatted).toMatchObject({ degraded: false, text: 'Amount: 1.5 USDC' });
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
