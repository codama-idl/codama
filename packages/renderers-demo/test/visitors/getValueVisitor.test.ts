import {
    arrayValueNode,
    booleanValueNode,
    bytesValueNode,
    constantValueNode,
    constantValueNodeFromBytes,
    enumValueNode,
    mapEntryValueNode,
    mapValueNode,
    noneValueNode,
    numberTypeNode,
    numberValueNode,
    ProgramIdValueNode,
    programIdValueNode,
    publicKeyValueNode,
    setValueNode,
    someValueNode,
    stringValueNode,
    structFieldValueNode,
    structValueNode,
    tupleValueNode,
    ValueNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { addFragmentImports, Fragment, fragment } from '../../src/utils';
import { getValueVisitor } from '../../src/visitors';

function expectValue(node: ProgramIdValueNode | ValueNode, expected: Fragment | string): void {
    expect(visit(node, getValueVisitor())).toStrictEqual(
        typeof expected === 'string' ? fragment`${expected}` : expected,
    );
}

test('it renders array values', () => {
    expectValue(arrayValueNode([]), '[]');
    expectValue(arrayValueNode([numberValueNode(1), numberValueNode(2)]), '[1, 2]');
});

test('it renders boolean values', () => {
    expectValue(booleanValueNode(true), 'true');
    expectValue(booleanValueNode(false), 'false');
});

test('it renders byte values', () => {
    expectValue(bytesValueNode('utf8', ''), '0x');
    expectValue(bytesValueNode('utf8', 'hello'), '0x68656c6c6f');
    expectValue(bytesValueNode('base16', 'deadface'), '0xdeadface');
    expectValue(bytesValueNode('base58', 'HeLLo'), '0x0b39f6f0');
    expectValue(bytesValueNode('base64', 'hello'), '0x85e965');
});

test('it renders constant values', () => {
    expectValue(constantValueNode(numberTypeNode('u8'), numberValueNode(42)), '42');
    expectValue(constantValueNodeFromBytes('utf8', 'hello'), '0x68656c6c6f');
    expectValue(constantValueNodeFromBytes('base16', 'deadbeef'), '0xdeadbeef');
    expectValue(constantValueNodeFromBytes('base58', 'HeLLo'), '0x0b39f6f0');
    expectValue(constantValueNodeFromBytes('base64', 'hello'), '0x85e965');
});

test('it renders enum values', () => {
    expectValue(
        enumValueNode('direction', 'left'),
        addFragmentImports(fragment`Direction.Left`, 'generatedTypes', 'Direction'),
    );
});

test('it renders map values', () => {
    expectValue(
        mapValueNode([
            mapEntryValueNode(stringValueNode('Alice'), numberValueNode(30)),
            mapEntryValueNode(stringValueNode('Bob'), numberValueNode(42)),
            mapEntryValueNode(stringValueNode('Carla'), numberValueNode(39)),
        ]),
        'new Map([["Alice", 30], ["Bob", 42], ["Carla", 39]])',
    );
});

test('it renders none values', () => {
    expectValue(noneValueNode(), 'null');
});

test('it renders number values', () => {
    expectValue(numberValueNode(0), '0');
    expectValue(numberValueNode(42), '42');
    expectValue(numberValueNode(-2.5), '-2.5');
});

test('it renders program id values', () => {
    expectValue(programIdValueNode(), 'programId');
});

test('it renders public key values', () => {
    expectValue(
        publicKeyValueNode('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        '"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"',
    );
});

test('it renders set values', () => {
    expectValue(setValueNode([]), 'new Set([])');
    expectValue(setValueNode([numberValueNode(1), numberValueNode(2)]), 'new Set([1, 2])');
});

test('it ignores some values', () => {
    expectValue(someValueNode(numberValueNode(42)), '42');
    expectValue(someValueNode(stringValueNode('hello')), '"hello"');
});

test('it renders string values', () => {
    expectValue(stringValueNode(''), '""');
    expectValue(stringValueNode('hello'), '"hello"');
});

test('it renders struct values', () => {
    expectValue(structValueNode([]), '{}');
    expectValue(
        structValueNode([
            structFieldValueNode('name', stringValueNode('Alice')),
            structFieldValueNode('age', numberValueNode(30)),
        ]),
        '{ name: "Alice", age: 30 }',
    );
});

test('it renders tuple values', () => {
    expectValue(tupleValueNode([]), '[]');
    expectValue(tupleValueNode([stringValueNode('Alice'), numberValueNode(30)]), '["Alice", 30]');
});
