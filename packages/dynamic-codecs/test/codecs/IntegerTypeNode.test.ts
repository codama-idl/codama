import { integerTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('u8', () => {
    const codec = getNodeValueCodec([integerTypeNode('u8')]);
    expect(codec.encode(42)).toStrictEqual(hex('2a'));
    expect(codec.encode(42n)).toStrictEqual(hex('2a'));
    expect(codec.decode(hex('2a'))).toBe(42n);
});

test('u16', () => {
    const codec = getNodeValueCodec([integerTypeNode('u16')]);
    expect(codec.encode(42)).toStrictEqual(hex('2a00'));
    expect(codec.decode(hex('2a00'))).toBe(42n);
});

test('u32', () => {
    const codec = getNodeValueCodec([integerTypeNode('u32')]);
    expect(codec.encode(42)).toStrictEqual(hex('2a000000'));
    expect(codec.decode(hex('2a000000'))).toBe(42n);
});

test('u64', () => {
    const codec = getNodeValueCodec([integerTypeNode('u64')]);
    expect(codec.encode(42)).toStrictEqual(hex('2a00000000000000'));
    expect(codec.decode(hex('2a00000000000000'))).toBe(42n);
});

test('u128', () => {
    const codec = getNodeValueCodec([integerTypeNode('u128')]);
    expect(codec.encode(42)).toStrictEqual(hex('2a000000000000000000000000000000'));
    expect(codec.decode(hex('2a000000000000000000000000000000'))).toBe(42n);
});

test('i8', () => {
    const codec = getNodeValueCodec([integerTypeNode('i8')]);
    expect(codec.encode(-42)).toStrictEqual(hex('d6'));
    expect(codec.decode(hex('d6'))).toBe(-42n);
});

test('i16', () => {
    const codec = getNodeValueCodec([integerTypeNode('i16')]);
    expect(codec.encode(-42)).toStrictEqual(hex('d6ff'));
    expect(codec.decode(hex('d6ff'))).toBe(-42n);
});

test('i32', () => {
    const codec = getNodeValueCodec([integerTypeNode('i32')]);
    expect(codec.encode(-42)).toStrictEqual(hex('d6ffffff'));
    expect(codec.decode(hex('d6ffffff'))).toBe(-42n);
});

test('i64', () => {
    const codec = getNodeValueCodec([integerTypeNode('i64')]);
    expect(codec.encode(-42)).toStrictEqual(hex('d6ffffffffffffff'));
    expect(codec.decode(hex('d6ffffffffffffff'))).toBe(-42n);
});

test('i128', () => {
    const codec = getNodeValueCodec([integerTypeNode('i128')]);
    expect(codec.encode(-42)).toStrictEqual(hex('d6ffffffffffffffffffffffffffffff'));
    expect(codec.decode(hex('d6ffffffffffffffffffffffffffffff'))).toBe(-42n);
});

test('shortU16', () => {
    const codec = getNodeValueCodec([integerTypeNode('shortU16')]);
    expect(codec.encode(42)).toStrictEqual(hex('2a'));
    expect(codec.decode(hex('2a'))).toBe(42n);
    expect(codec.encode(128)).toStrictEqual(hex('8001'));
    expect(codec.decode(hex('8001'))).toBe(128n);
});

test('big-endian', () => {
    const u16 = getNodeValueCodec([integerTypeNode('u16', { endian: 'be' })]);
    expect(u16.encode(42)).toStrictEqual(hex('002a'));
    expect(u16.decode(hex('002a'))).toBe(42n);

    const i64 = getNodeValueCodec([integerTypeNode('i64', { endian: 'be' })]);
    expect(i64.encode(-42)).toStrictEqual(hex('ffffffffffffffd6'));
    expect(i64.decode(hex('ffffffffffffffd6'))).toBe(-42n);
});
