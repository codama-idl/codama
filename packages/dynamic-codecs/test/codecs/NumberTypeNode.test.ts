import { numberTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeCodec } from '../../src';
import { hex } from '../_setup';

test('u8', () => {
    const codec = getNodeCodec([numberTypeNode('u8')]);
    expect(codec.encode(42)).toStrictEqual(hex('2a'));
    expect(codec.decode(hex('2a'))).toBe(42);
});

test('u16', () => {
    const codec = getNodeCodec([numberTypeNode('u16')]);
    expect(codec.encode(42)).toStrictEqual(hex('2a00'));
    expect(codec.decode(hex('2a00'))).toBe(42);
});

test('u32', () => {
    const codec = getNodeCodec([numberTypeNode('u32')]);
    expect(codec.encode(42)).toStrictEqual(hex('2a000000'));
    expect(codec.decode(hex('2a000000'))).toBe(42);
});

test('u64', () => {
    const codec = getNodeCodec([numberTypeNode('u64')]);
    expect(codec.encode(42)).toStrictEqual(hex('2a00000000000000'));
    expect(codec.decode(hex('2a00000000000000'))).toBe(42n);
});

test('u128', () => {
    const codec = getNodeCodec([numberTypeNode('u128')]);
    expect(codec.encode(42)).toStrictEqual(hex('2a000000000000000000000000000000'));
    expect(codec.decode(hex('2a000000000000000000000000000000'))).toBe(42n);
});

test('i8', () => {
    const codec = getNodeCodec([numberTypeNode('i8')]);
    expect(codec.encode(-42)).toStrictEqual(hex('d6'));
    expect(codec.decode(hex('d6'))).toBe(-42);
});

test('i16', () => {
    const codec = getNodeCodec([numberTypeNode('i16')]);
    expect(codec.encode(-42)).toStrictEqual(hex('d6ff'));
    expect(codec.decode(hex('d6ff'))).toBe(-42);
});

test('i32', () => {
    const codec = getNodeCodec([numberTypeNode('i32')]);
    expect(codec.encode(-42)).toStrictEqual(hex('d6ffffff'));
    expect(codec.decode(hex('d6ffffff'))).toBe(-42);
});

test('i64', () => {
    const codec = getNodeCodec([numberTypeNode('i64')]);
    expect(codec.encode(-42)).toStrictEqual(hex('d6ffffffffffffff'));
    expect(codec.decode(hex('d6ffffffffffffff'))).toBe(-42n);
});

test('i128', () => {
    const codec = getNodeCodec([numberTypeNode('i128')]);
    expect(codec.encode(-42)).toStrictEqual(hex('d6ffffffffffffffffffffffffffffff'));
    expect(codec.decode(hex('d6ffffffffffffffffffffffffffffff'))).toBe(-42n);
});

test('f32', () => {
    const codec = getNodeCodec([numberTypeNode('f32')]);
    expect(codec.encode(1.5)).toStrictEqual(hex('0000c03f'));
    expect(codec.decode(hex('0000c03f'))).toBe(1.5);
});

test('f64', () => {
    const codec = getNodeCodec([numberTypeNode('f64')]);
    expect(codec.encode(1.5)).toStrictEqual(hex('000000000000f83f'));
    expect(codec.decode(hex('000000000000f83f'))).toBe(1.5);
});

test('shortU16', () => {
    const codec = getNodeCodec([numberTypeNode('shortU16')]);
    expect(codec.encode(42)).toStrictEqual(hex('2a'));
    expect(codec.decode(hex('2a'))).toBe(42);
    expect(codec.encode(128)).toStrictEqual(hex('8001'));
    expect(codec.decode(hex('8001'))).toBe(128);
});
