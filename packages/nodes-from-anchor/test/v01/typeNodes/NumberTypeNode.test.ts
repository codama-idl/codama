import { numberTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV01 } from '../../../src';

test('it creates number type nodes', () => {
    expect(typeNodeFromAnchorV01('f32')).toEqual(numberTypeNode('f32'));
    expect(typeNodeFromAnchorV01('f64')).toEqual(numberTypeNode('f64'));
    expect(typeNodeFromAnchorV01('i8')).toEqual(numberTypeNode('i8'));
    expect(typeNodeFromAnchorV01('i16')).toEqual(numberTypeNode('i16'));
    expect(typeNodeFromAnchorV01('i32')).toEqual(numberTypeNode('i32'));
    expect(typeNodeFromAnchorV01('i64')).toEqual(numberTypeNode('i64'));
    expect(typeNodeFromAnchorV01('i128')).toEqual(numberTypeNode('i128'));
    expect(typeNodeFromAnchorV01('shortU16')).toEqual(numberTypeNode('shortU16'));
    expect(typeNodeFromAnchorV01('u8')).toEqual(numberTypeNode('u8'));
    expect(typeNodeFromAnchorV01('u16')).toEqual(numberTypeNode('u16'));
    expect(typeNodeFromAnchorV01('u32')).toEqual(numberTypeNode('u32'));
    expect(typeNodeFromAnchorV01('u64')).toEqual(numberTypeNode('u64'));
    expect(typeNodeFromAnchorV01('u128')).toEqual(numberTypeNode('u128'));
});
