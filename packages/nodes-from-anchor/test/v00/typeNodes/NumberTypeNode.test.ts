import { floatTypeNode, integerTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates float type nodes', () => {
    expect(typeNodeFromAnchorV00('f32')).toEqual(floatTypeNode('f32'));
    expect(typeNodeFromAnchorV00('f64')).toEqual(floatTypeNode('f64'));
});

test('it creates integer type nodes', () => {
    expect(typeNodeFromAnchorV00('i8')).toEqual(integerTypeNode('i8'));
    expect(typeNodeFromAnchorV00('i16')).toEqual(integerTypeNode('i16'));
    expect(typeNodeFromAnchorV00('i32')).toEqual(integerTypeNode('i32'));
    expect(typeNodeFromAnchorV00('i64')).toEqual(integerTypeNode('i64'));
    expect(typeNodeFromAnchorV00('i128')).toEqual(integerTypeNode('i128'));
    expect(typeNodeFromAnchorV00('shortU16')).toEqual(integerTypeNode('shortU16'));
    expect(typeNodeFromAnchorV00('u8')).toEqual(integerTypeNode('u8'));
    expect(typeNodeFromAnchorV00('u16')).toEqual(integerTypeNode('u16'));
    expect(typeNodeFromAnchorV00('u32')).toEqual(integerTypeNode('u32'));
    expect(typeNodeFromAnchorV00('u64')).toEqual(integerTypeNode('u64'));
    expect(typeNodeFromAnchorV00('u128')).toEqual(integerTypeNode('u128'));
});
