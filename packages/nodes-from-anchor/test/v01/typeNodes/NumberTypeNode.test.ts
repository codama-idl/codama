import { numberTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV01 } from '../../../src/index.js';

test('it creates number type nodes', t => {
    t.deepEqual(typeNodeFromAnchorV01('f32'), numberTypeNode('f32'));
    t.deepEqual(typeNodeFromAnchorV01('f64'), numberTypeNode('f64'));
    t.deepEqual(typeNodeFromAnchorV01('i8'), numberTypeNode('i8'));
    t.deepEqual(typeNodeFromAnchorV01('i16'), numberTypeNode('i16'));
    t.deepEqual(typeNodeFromAnchorV01('i32'), numberTypeNode('i32'));
    t.deepEqual(typeNodeFromAnchorV01('i64'), numberTypeNode('i64'));
    t.deepEqual(typeNodeFromAnchorV01('i128'), numberTypeNode('i128'));
    t.deepEqual(typeNodeFromAnchorV01('shortU16'), numberTypeNode('shortU16'));
    t.deepEqual(typeNodeFromAnchorV01('u8'), numberTypeNode('u8'));
    t.deepEqual(typeNodeFromAnchorV01('u16'), numberTypeNode('u16'));
    t.deepEqual(typeNodeFromAnchorV01('u32'), numberTypeNode('u32'));
    t.deepEqual(typeNodeFromAnchorV01('u64'), numberTypeNode('u64'));
    t.deepEqual(typeNodeFromAnchorV01('u128'), numberTypeNode('u128'));
});
