import { floatTypeNode, integerTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { GenericsV01, typeNodeFromAnchorV01 } from '../../../src';

const generics = {} as GenericsV01;

test('it creates float type nodes', () => {
    expect(typeNodeFromAnchorV01('f32', generics)).toEqual(floatTypeNode('f32'));
    expect(typeNodeFromAnchorV01('f64', generics)).toEqual(floatTypeNode('f64'));
});

test('it creates integer type nodes', () => {
    expect(typeNodeFromAnchorV01('i8', generics)).toEqual(integerTypeNode('i8'));
    expect(typeNodeFromAnchorV01('i16', generics)).toEqual(integerTypeNode('i16'));
    expect(typeNodeFromAnchorV01('i32', generics)).toEqual(integerTypeNode('i32'));
    expect(typeNodeFromAnchorV01('i64', generics)).toEqual(integerTypeNode('i64'));
    expect(typeNodeFromAnchorV01('i128', generics)).toEqual(integerTypeNode('i128'));
    expect(typeNodeFromAnchorV01('shortU16', generics)).toEqual(integerTypeNode('shortU16'));
    expect(typeNodeFromAnchorV01('u8', generics)).toEqual(integerTypeNode('u8'));
    expect(typeNodeFromAnchorV01('u16', generics)).toEqual(integerTypeNode('u16'));
    expect(typeNodeFromAnchorV01('u32', generics)).toEqual(integerTypeNode('u32'));
    expect(typeNodeFromAnchorV01('u64', generics)).toEqual(integerTypeNode('u64'));
    expect(typeNodeFromAnchorV01('u128', generics)).toEqual(integerTypeNode('u128'));
});
