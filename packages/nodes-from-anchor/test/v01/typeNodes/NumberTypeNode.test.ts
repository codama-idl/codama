import { numberTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { GenericsV01, typeNodeFromAnchorV01 } from '../../../src';

const generics = {} as GenericsV01;

test('it creates number type nodes', () => {
    expect(typeNodeFromAnchorV01('f32', generics)).toEqual(numberTypeNode('f32'));
    expect(typeNodeFromAnchorV01('f64', generics)).toEqual(numberTypeNode('f64'));
    expect(typeNodeFromAnchorV01('i8', generics)).toEqual(numberTypeNode('i8'));
    expect(typeNodeFromAnchorV01('i16', generics)).toEqual(numberTypeNode('i16'));
    expect(typeNodeFromAnchorV01('i32', generics)).toEqual(numberTypeNode('i32'));
    expect(typeNodeFromAnchorV01('i64', generics)).toEqual(numberTypeNode('i64'));
    expect(typeNodeFromAnchorV01('i128', generics)).toEqual(numberTypeNode('i128'));
    expect(typeNodeFromAnchorV01('shortU16', generics)).toEqual(numberTypeNode('shortU16'));
    expect(typeNodeFromAnchorV01('u8', generics)).toEqual(numberTypeNode('u8'));
    expect(typeNodeFromAnchorV01('u16', generics)).toEqual(numberTypeNode('u16'));
    expect(typeNodeFromAnchorV01('u32', generics)).toEqual(numberTypeNode('u32'));
    expect(typeNodeFromAnchorV01('u64', generics)).toEqual(numberTypeNode('u64'));
    expect(typeNodeFromAnchorV01('u128', generics)).toEqual(numberTypeNode('u128'));
});
