import { expect, test } from 'vitest';

import { splitLines } from '../../src/core/splitLines';

test('it returns a single line for an item without line breaks', () => {
    expect(splitLines('Hello.')).toEqual(['Hello.']);
});

test('it splits an item on line feeds', () => {
    expect(splitLines('First.\nSecond.')).toEqual(['First.', 'Second.']);
});

test('it splits an item on carriage return line feeds', () => {
    expect(splitLines('First.\r\nSecond.')).toEqual(['First.', 'Second.']);
});

test('it keeps empty lines between line breaks', () => {
    expect(splitLines('First.\n\nSecond.')).toEqual(['First.', '', 'Second.']);
});

test('it keeps an empty item as a single empty line', () => {
    expect(splitLines('')).toEqual(['']);
});

test('it ignores a trailing line feed', () => {
    expect(splitLines('Hello.\n')).toEqual(['Hello.']);
});

test('it ignores a trailing carriage return line feed', () => {
    expect(splitLines('Hello.\r\n')).toEqual(['Hello.']);
});

test('it only ignores one trailing line break', () => {
    expect(splitLines('Hello.\n\n')).toEqual(['Hello.', '']);
});

test('it returns a single empty line for an item made of a single line break', () => {
    expect(splitLines('\n')).toEqual(['']);
});
