import { CODAMA_ERROR__INVALID_INTERPOLATED_INTENT_PLACEHOLDER, CodamaError } from '@codama/errors';
import { expect, test } from 'vitest';

import {
    accountDataValueNode,
    accountValueNode,
    dataValueNode,
    parseInterpolatedIntent,
    printInterpolatedIntent,
} from '../src';

test('it parses text without placeholders', () => {
    expect(parseInterpolatedIntent('Close the account')).toStrictEqual(['Close the account']);
});

test('it parses an empty intent', () => {
    expect(parseInterpolatedIntent('')).toStrictEqual([]);
});

test('it parses data placeholders as data value nodes', () => {
    expect(parseInterpolatedIntent('Transfer ${data.amount}')).toStrictEqual(['Transfer ', dataValueNode('amount')]);
});

test('it parses nested data placeholders', () => {
    expect(parseInterpolatedIntent('${data.config.fees[0]}')).toStrictEqual([dataValueNode('config.fees[0]')]);
});

test('it parses data placeholders starting with an index', () => {
    expect(parseInterpolatedIntent('${data[0].amount}')).toStrictEqual([dataValueNode('[0].amount')]);
});

test('it parses account placeholders as account value nodes', () => {
    expect(parseInterpolatedIntent('to ${accounts.destination}')).toStrictEqual([
        'to ',
        accountValueNode('destination'),
    ]);
});

test('it parses account data placeholders as account data value nodes', () => {
    expect(parseInterpolatedIntent('${accounts.mint.data.decimals}')).toStrictEqual([
        accountDataValueNode('mint', { path: 'decimals' }),
    ]);
});

test('it parses account data placeholders starting with an index', () => {
    expect(parseInterpolatedIntent('${accounts.pool.data[0]}')).toStrictEqual([
        accountDataValueNode('pool', { path: '[0]' }),
    ]);
});

test('it parses account data placeholders without a path as the whole account data', () => {
    expect(parseInterpolatedIntent('${accounts.mint.data}')).toStrictEqual([accountDataValueNode('mint')]);
});

test('it parses consecutive placeholders without empty text between them', () => {
    expect(parseInterpolatedIntent('${data.a}${data.b}')).toStrictEqual([dataValueNode('a'), dataValueNode('b')]);
});

test('it keeps dollar signs and braces outside placeholders as text', () => {
    expect(parseInterpolatedIntent('Pay $5 {now} ${data.amount}')).toStrictEqual([
        'Pay $5 {now} ',
        dataValueNode('amount'),
    ]);
});

test.each([
    ['an unknown root', 'Send ${amount}', '${amount}'],
    ['a data root without a path', 'Send ${data}', '${data}'],
    ['a data path starting with a dot and an index', 'Send ${data.[0]}', '${data.[0]}'],
    ['an invalid data path', 'Send ${data.a..b}', '${data.a..b}'],
    ['an account attribute other than data', 'Send ${accounts.mint.lamports}', '${accounts.mint.lamports}'],
    ['an account attribute starting with data', 'Send ${accounts.mint.database}', '${accounts.mint.database}'],
    [
        'an account attribute followed by a path',
        'Send ${accounts.mint.meta.decimals}',
        '${accounts.mint.meta.decimals}',
    ],
    ['an accounts root without an account', 'Send ${accounts}', '${accounts}'],
    ['whitespace', 'Send ${ data.amount }', '${ data.amount }'],
    ['an unclosed placeholder', 'Send ${data.amount', '${data.amount'],
])('it throws on placeholders with %s', (_, template, placeholder) => {
    expect(() => parseInterpolatedIntent(template)).toThrow(
        new CodamaError(CODAMA_ERROR__INVALID_INTERPOLATED_INTENT_PLACEHOLDER, { placeholder, template }),
    );
});

test('it prints parts back into their template', () => {
    const parts = [
        'Transfer ',
        dataValueNode('amount'),
        ' to ',
        accountValueNode('destination'),
        ' of ',
        accountDataValueNode('mint', { path: 'decimals' }),
    ];
    expect(printInterpolatedIntent(parts)).toBe(
        'Transfer ${data.amount} to ${accounts.destination} of ${accounts.mint.data.decimals}',
    );
});

test('it prints paths starting with an index without a dot', () => {
    expect(printInterpolatedIntent([dataValueNode('[0].amount'), accountDataValueNode('pool', { path: '[1]' })])).toBe(
        '${data[0].amount}${accounts.pool.data[1]}',
    );
});

test('it prints account data without a path as the whole account data', () => {
    expect(printInterpolatedIntent([accountDataValueNode('mint')])).toBe('${accounts.mint.data}');
});

test('it prints parsed templates back unchanged', () => {
    const template = 'Swap ${data[0].amount} of ${accounts.pool.data.mints[1]} for ${accounts.owner}, ${data.x}$';
    expect(printInterpolatedIntent(parseInterpolatedIntent(template))).toBe(template);
});
