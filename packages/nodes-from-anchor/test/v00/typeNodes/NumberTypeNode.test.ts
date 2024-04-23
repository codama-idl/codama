import { numberTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV00 } from '../../../src/index.js';

test('it creates number type nodes', t => {
    t.deepEqual(typeNodeFromAnchorV00('f32'), numberTypeNode('f32'));
    t.deepEqual(typeNodeFromAnchorV00('f64'), numberTypeNode('f64'));
    t.deepEqual(typeNodeFromAnchorV00('i8'), numberTypeNode('i8'));
    t.deepEqual(typeNodeFromAnchorV00('i16'), numberTypeNode('i16'));
    t.deepEqual(typeNodeFromAnchorV00('i32'), numberTypeNode('i32'));
    t.deepEqual(typeNodeFromAnchorV00('i64'), numberTypeNode('i64'));
    t.deepEqual(typeNodeFromAnchorV00('i128'), numberTypeNode('i128'));
    t.deepEqual(typeNodeFromAnchorV00('shortU16'), numberTypeNode('shortU16'));
    t.deepEqual(typeNodeFromAnchorV00('u8'), numberTypeNode('u8'));
    t.deepEqual(typeNodeFromAnchorV00('u16'), numberTypeNode('u16'));
    t.deepEqual(typeNodeFromAnchorV00('u32'), numberTypeNode('u32'));
    t.deepEqual(typeNodeFromAnchorV00('u64'), numberTypeNode('u64'));
    t.deepEqual(typeNodeFromAnchorV00('u128'), numberTypeNode('u128'));
});
