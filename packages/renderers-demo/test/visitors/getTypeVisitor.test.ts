import {
    AccountNode,
    accountNode,
    amountTypeNode,
    arrayTypeNode,
    booleanTypeNode,
    bytesTypeNode,
    constantValueNodeFromString,
    dateTimeTypeNode,
    definedTypeLinkNode,
    DefinedTypeNode,
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTupleVariantTypeNode,
    enumTypeNode,
    fixedCountNode,
    fixedSizeTypeNode,
    hiddenPrefixTypeNode,
    hiddenSuffixTypeNode,
    instructionArgumentNode,
    InstructionNode,
    instructionNode,
    mapTypeNode,
    numberTypeNode,
    optionTypeNode,
    postOffsetTypeNode,
    preOffsetTypeNode,
    publicKeyTypeNode,
    remainderCountNode,
    remainderOptionTypeNode,
    sentinelTypeNode,
    setTypeNode,
    sizePrefixTypeNode,
    solAmountTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
    TypeNode,
    zeroableOptionTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { addFragmentImports, Fragment, fragment } from '../../src/utils';
import { getTypeVisitor } from '../../src/visitors';

function expectType(
    node: AccountNode | DefinedTypeNode | InstructionNode | TypeNode,
    expected: Fragment | string,
): void {
    expect(visit(node, getTypeVisitor())).toStrictEqual(
        typeof expected === 'string' ? fragment`${expected}` : expected,
    );
}

test('it renders accounts', () => {
    expectType(
        accountNode({
            data: structTypeNode([
                structFieldTypeNode({ name: 'amount', type: numberTypeNode('u64') }),
                structFieldTypeNode({ name: 'decimals', type: numberTypeNode('u8') }),
            ]),
            name: 'mint',
        }),
        'type Mint = { amount: number /* u64 */; decimals: number /* u8 */ }',
    );
});

test('it ignores amount types', () => {
    expectType(amountTypeNode(numberTypeNode('u32'), 2), 'number /* u32 */');
});

test('it renders array types', () => {
    expectType(arrayTypeNode(stringTypeNode('utf8'), remainderCountNode()), 'Array<string>');
});

test('it renders boolean types', () => {
    expectType(booleanTypeNode(), 'boolean');
});

test('it renders bytes types', () => {
    expectType(bytesTypeNode(), 'bytes');
});

test('it ignores date time types', () => {
    expectType(dateTimeTypeNode(numberTypeNode('u32')), 'number /* u32 */');
});

test('it renders defined types', () => {
    expectType(definedTypeNode({ name: 'nameAlias', type: stringTypeNode('utf8') }), 'type NameAlias = string');
    expectType(
        definedTypeNode({
            name: 'person',
            type: structTypeNode([
                structFieldTypeNode({ name: 'name', type: definedTypeLinkNode('nameAlias') }),
                structFieldTypeNode({ name: 'age', type: numberTypeNode('u32') }),
            ]),
        }),
        addFragmentImports(
            fragment`type Person = { name: NameAlias; age: number /* u32 */ }`,
            'generatedTypes',
            'NameAlias',
        ),
    );
    expectType(
        definedTypeNode({
            name: 'direction',
            type: enumTypeNode([
                enumEmptyVariantTypeNode('up'),
                enumEmptyVariantTypeNode('right'),
                enumEmptyVariantTypeNode('down'),
                enumEmptyVariantTypeNode('left'),
            ]),
        }),
        'enum Direction { Up, Right, Down, Left }',
    );
    expectType(
        definedTypeNode({
            name: 'command',
            type: enumTypeNode([
                enumTupleVariantTypeNode('write', tupleTypeNode([stringTypeNode('utf8')])),
                enumTupleVariantTypeNode('yell', tupleTypeNode([stringTypeNode('utf8')])),
            ]),
        }),
        'type Command = { __kind: "Write"; fields: [string] } | { __kind: "Yell"; fields: [string] }',
    );
});

test('it renders defined type links', () => {
    expectType(
        definedTypeLinkNode('semverVersion'),
        addFragmentImports(fragment`SemverVersion`, 'generatedTypes', 'SemverVersion'),
    );
});

test('it renders enum types', () => {
    expectType(
        enumTypeNode([
            enumEmptyVariantTypeNode('up'),
            enumEmptyVariantTypeNode('right'),
            enumEmptyVariantTypeNode('down'),
            enumEmptyVariantTypeNode('left'),
        ]),
        '{ Up, Right, Down, Left }',
    );
    expectType(
        enumTypeNode([
            enumEmptyVariantTypeNode('firstVariantInTheEnumWithALongName'),
            enumEmptyVariantTypeNode('secondVariantInTheEnumWithALongName'),
            enumEmptyVariantTypeNode('thirdVariantInTheEnumWithALongName'),
        ]),
        `{
    FirstVariantInTheEnumWithALongName,
    SecondVariantInTheEnumWithALongName,
    ThirdVariantInTheEnumWithALongName,
}`,
    );
    expectType(
        enumTypeNode([
            enumTupleVariantTypeNode('write', tupleTypeNode([stringTypeNode('utf8')])),
            enumTupleVariantTypeNode('yell', tupleTypeNode([stringTypeNode('utf8')])),
        ]),
        `{ __kind: "Write"; fields: [string] } | { __kind: "Yell"; fields: [string] }`,
    );
    expectType(
        enumTypeNode([
            enumTupleVariantTypeNode('write', tupleTypeNode([stringTypeNode('utf8')])),
            enumStructVariantTypeNode(
                'move',
                structTypeNode([
                    structFieldTypeNode({ name: 'x', type: numberTypeNode('u64') }),
                    structFieldTypeNode({ name: 'y', type: numberTypeNode('u64') }),
                ]),
            ),
            enumEmptyVariantTypeNode('quit'),
        ]),
        `| { __kind: "Write"; fields: [string] }
    | { __kind: "Move"; x: number /* u64 */; y: number /* u64 */ }
    | { __kind: "Quit" }`,
    );
});

test('it ignores fixed size types', () => {
    expectType(fixedSizeTypeNode(stringTypeNode('utf8'), 42), 'string');
});

test('it ignores hidden prefix types', () => {
    expectType(hiddenPrefixTypeNode(stringTypeNode('utf8'), []), 'string');
});

test('it ignores hidden suffix types', () => {
    expectType(hiddenSuffixTypeNode(stringTypeNode('utf8'), []), 'string');
});

test('it renders instructions', () => {
    expectType(
        instructionNode({
            arguments: [
                instructionArgumentNode({ name: 'discriminator', type: numberTypeNode('u8') }),
                instructionArgumentNode({ name: 'authority', type: publicKeyTypeNode() }),
                instructionArgumentNode({ name: 'age', type: numberTypeNode('u32') }),
                instructionArgumentNode({ name: 'name', type: stringTypeNode('utf8') }),
            ],
            name: 'initializePerson',
        }),
        'type InitializePersonInstruction = { discriminator: number /* u8 */; authority: Address; age: number /* u32 */; name: string }',
    );
});

test('it renders map types', () => {
    expectType(
        mapTypeNode(stringTypeNode('utf8'), numberTypeNode('u32'), fixedCountNode(3)),
        'Map<string, number /* u32 */>',
    );
});

test('it renders number types', () => {
    expectType(numberTypeNode('u32'), 'number /* u32 */');
});

test('it renders option types', () => {
    expectType(optionTypeNode(stringTypeNode('utf8')), 'Option<string>');
});

test('it ignores post-offset types', () => {
    expectType(postOffsetTypeNode(stringTypeNode('utf8'), 4), 'string');
});

test('it ignores pre-offset types', () => {
    expectType(preOffsetTypeNode(stringTypeNode('utf8'), 4), 'string');
});

test('it renders public key types', () => {
    expectType(publicKeyTypeNode(), 'Address');
});

test('it renders remainder option types', () => {
    expectType(remainderOptionTypeNode(stringTypeNode('utf8')), 'Option<string>');
});

test('it ignores sentinel types', () => {
    expectType(sentinelTypeNode(stringTypeNode('utf8'), constantValueNodeFromString('base16', 'ff')), 'string');
});

test('it renders set types', () => {
    expectType(setTypeNode(stringTypeNode('utf8'), fixedCountNode(3)), 'Set<string>');
});

test('it ignores size prefix types', () => {
    expectType(sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32')), 'string');
});

test('it ignores sol amount types', () => {
    expectType(solAmountTypeNode(numberTypeNode('u32')), 'number /* u32 */');
});

test('it renders string types', () => {
    expectType(stringTypeNode('utf8'), 'string');
});

test('it renders struct types', () => {
    expectType(structTypeNode([]), '{}');
    expectType(
        structTypeNode([
            structFieldTypeNode({ name: 'name', type: stringTypeNode('utf8') }),
            structFieldTypeNode({ name: 'age', type: numberTypeNode('u32') }),
        ]),
        '{ name: string; age: number /* u32 */ }',
    );
    expectType(
        structTypeNode([
            structFieldTypeNode({ name: 'firstFieldInTheTupleWithALongName', type: stringTypeNode('utf8') }),
            structFieldTypeNode({ name: 'secondFieldInTheTupleWithALongName', type: stringTypeNode('utf8') }),
            structFieldTypeNode({ name: 'thirdFieldInTheTupleWithALongName', type: stringTypeNode('utf8') }),
            structFieldTypeNode({
                name: 'nestedStruct',
                type: structTypeNode([
                    structFieldTypeNode({ name: 'name', type: stringTypeNode('utf8') }),
                    structFieldTypeNode({ name: 'age', type: numberTypeNode('u32') }),
                ]),
            }),
        ]),
        `{
    firstFieldInTheTupleWithALongName: string;
    secondFieldInTheTupleWithALongName: string;
    thirdFieldInTheTupleWithALongName: string;
    nestedStruct: { name: string; age: number /* u32 */ };
}`,
    );
});

test('it renders tuple types', () => {
    expectType(tupleTypeNode([stringTypeNode('utf8'), numberTypeNode('u32')]), '[string, number /* u32 */]');
    expectType(
        tupleTypeNode([
            definedTypeLinkNode('firstItemInTheTupleWithALongName'),
            definedTypeLinkNode('secondItemInTheTupleWithALongName'),
            definedTypeLinkNode('thirdItemInTheTupleWithALongName'),
            tupleTypeNode([stringTypeNode('utf8'), numberTypeNode('u32')]),
        ]),
        addFragmentImports(
            fragment`[
    FirstItemInTheTupleWithALongName,
    SecondItemInTheTupleWithALongName,
    ThirdItemInTheTupleWithALongName,
    [string, number /* u32 */],
]`,
            'generatedTypes',
            [
                'FirstItemInTheTupleWithALongName',
                'SecondItemInTheTupleWithALongName',
                'ThirdItemInTheTupleWithALongName',
            ],
        ),
    );
});

test('it renders ZeroableOption types', () => {
    expectType(zeroableOptionTypeNode(stringTypeNode('utf8')), 'Option<string>');
});
