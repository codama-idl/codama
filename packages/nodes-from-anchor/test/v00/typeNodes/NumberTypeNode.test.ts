import { numberTypeNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates number type nodes', () => {
    expect(typeNodeFromAnchorV00('f32')).toEqual(numberTypeNode('f32'));
    expect(typeNodeFromAnchorV00('f64')).toEqual(numberTypeNode('f64'));
    expect(typeNodeFromAnchorV00('i8')).toEqual(numberTypeNode('i8'));
    expect(typeNodeFromAnchorV00('i16')).toEqual(numberTypeNode('i16'));
    expect(typeNodeFromAnchorV00('i32')).toEqual(numberTypeNode('i32'));
    expect(typeNodeFromAnchorV00('i64')).toEqual(numberTypeNode('i64'));
    expect(typeNodeFromAnchorV00('i128')).toEqual(numberTypeNode('i128'));
    expect(typeNodeFromAnchorV00('shortU16')).toEqual(numberTypeNode('shortU16'));
    expect(typeNodeFromAnchorV00('u8')).toEqual(numberTypeNode('u8'));
    expect(typeNodeFromAnchorV00('u16')).toEqual(numberTypeNode('u16'));
    expect(typeNodeFromAnchorV00('u32')).toEqual(numberTypeNode('u32'));
    expect(typeNodeFromAnchorV00('u64')).toEqual(numberTypeNode('u64'));
    expect(typeNodeFromAnchorV00('u128')).toEqual(numberTypeNode('u128'));
});
