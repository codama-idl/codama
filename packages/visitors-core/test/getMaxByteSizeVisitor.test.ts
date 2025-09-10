import {
    accountNode,
    amountTypeNode,
    arrayTypeNode,
    booleanTypeNode,
    bytesTypeNode,
    bytesValueNode,
    constantValueNode,
    constantValueNodeFromString,
    dateTimeTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumTupleVariantTypeNode,
    enumTypeNode,
    fixedCountNode,
    fixedSizeTypeNode,
    GetNodeFromKind,
    hiddenPrefixTypeNode,
    hiddenSuffixTypeNode,
    instructionArgumentNode,
    instructionNode,
    mapTypeNode,
    NumberFormat,
    numberTypeNode,
    numberValueNode,
    optionTypeNode,
    postOffsetTypeNode,
    prefixedCountNode,
    preOffsetTypeNode,
    programLinkNode,
    programNode,
    publicKeyTypeNode,
    remainderCountNode,
    remainderOptionTypeNode,
    rootNode,
    sentinelTypeNode,
    setTypeNode,
    sizePrefixTypeNode,
    solAmountTypeNode,
    someValueNode,
    stringTypeNode,
    stringValueNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
    zeroableOptionTypeNode,
} from '@codama/nodes';
import { describe, expect, test } from 'vitest';

import {
    ByteSizeVisitorKeys,
    getLastNodeFromPath,
    getMaxByteSizeVisitor,
    getRecordLinkablesVisitor,
    LinkableDictionary,
    NodePath,
    NodeStack,
    visit,
} from '../src';

const expectMaxSize = (
    node: GetNodeFromKind<ByteSizeVisitorKeys>,
    expectedMaxSize: number | null,
    linkables?: LinkableDictionary,
    stack?: NodeStack,
) => {
    expect(visit(node, getMaxByteSizeVisitor(linkables ?? new LinkableDictionary(), { stack }))).toBe(expectedMaxSize);
};

const expectMaxSizeWithContext = (
    nodePath: NodePath<GetNodeFromKind<ByteSizeVisitorKeys>>,
    expectedMaxSize: number | null,
) => {
    const node = getLastNodeFromPath(nodePath);
    const stack = new NodeStack(nodePath.slice(0, -1));
    const linkables = new LinkableDictionary();
    visit(nodePath[0], getRecordLinkablesVisitor(linkables));
    expectMaxSize(node, expectedMaxSize, linkables, stack);
};

describe('accountNode', () => {
    test('it returns the max size of the account data', () => {
        expectMaxSize(
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({ name: 'authority', type: publicKeyTypeNode() }),
                    structFieldTypeNode({ name: 'maxSupply', type: optionTypeNode(numberTypeNode('u64')) }),
                ]),
                name: 'mint',
            }),
            32 + 9,
        );
    });
});

describe('amountTypeNode', () => {
    test('it delegates to the underlying number type', () => {
        expectMaxSize(amountTypeNode(numberTypeNode('u64'), 2, 'GBP'), 8);
        expectMaxSize(amountTypeNode(numberTypeNode('shortU16'), 2, 'GBP'), 3);
    });
});

describe('arrayTypeNode', () => {
    test('it multiplies the max size of the inner item with the fixed count', () => {
        expectMaxSize(arrayTypeNode(optionTypeNode(numberTypeNode('u32')), fixedCountNode(3)), 5 * 3);
    });
    test('it returns 0 if the count is 0 and the inner type is unsized', () => {
        expectMaxSize(arrayTypeNode(stringTypeNode('utf8'), fixedCountNode(0)), 0);
    });
    test('it returns null if the count is not fixed', () => {
        expectMaxSize(arrayTypeNode(numberTypeNode('u16'), prefixedCountNode(numberTypeNode('u8'))), null);
        expectMaxSize(arrayTypeNode(numberTypeNode('u16'), remainderCountNode()), null);
    });
    test('it returns null if the inner type has no max size', () => {
        expectMaxSize(arrayTypeNode(stringTypeNode('utf8'), fixedCountNode(3)), null);
        expectMaxSize(arrayTypeNode(stringTypeNode('utf8'), prefixedCountNode(numberTypeNode('u8'))), null);
        expectMaxSize(arrayTypeNode(stringTypeNode('utf8'), remainderCountNode()), null);
    });
    test('it returns 0 if the inner type max size is 0 and the count is fixed', () => {
        expectMaxSize(arrayTypeNode(tupleTypeNode([]), fixedCountNode(3)), 0);
    });
    test('it returns 0 if the inner type max size is 0 and the count is remainder', () => {
        expectMaxSize(arrayTypeNode(tupleTypeNode([]), remainderCountNode()), 0);
    });
    test('it returns the prefix max size if the inner type size is 0 and the count is prefixed', () => {
        expectMaxSize(arrayTypeNode(tupleTypeNode([]), prefixedCountNode(numberTypeNode('u32'))), 4);
        expectMaxSize(arrayTypeNode(tupleTypeNode([]), prefixedCountNode(numberTypeNode('shortU16'))), 3);
    });
});

describe('booleanTypeNode', () => {
    test('it returns 1 by default', () => {
        expectMaxSize(booleanTypeNode(), 1);
    });
    test('it delegates to the custom boolean size otherwise', () => {
        expectMaxSize(booleanTypeNode(numberTypeNode('u64')), 8);
        expectMaxSize(booleanTypeNode(numberTypeNode('shortU16')), 3);
    });
});

describe('bytesTypeNode', () => {
    test('it always returns null', () => {
        expectMaxSize(bytesTypeNode(), null);
    });
});

describe('constantValueNode', () => {
    test('it returns the type size if it has a max size', () => {
        expectMaxSize(constantValueNode(optionTypeNode(numberTypeNode('u32')), someValueNode(numberValueNode(42))), 5);
        expectMaxSize(constantValueNode(fixedSizeTypeNode(stringTypeNode('utf8'), 42), stringValueNode('Hello')), 42);
    });
    test('it returns the size of byte value nodes when used with a base16 encoding', () => {
        expectMaxSize(constantValueNode(bytesTypeNode(), bytesValueNode('base16', '11223344')), 4);
    });
    test('it returns the size of string value nodes when used with a base16 encoding', () => {
        expectMaxSize(constantValueNode(stringTypeNode('base16'), stringValueNode('11223344')), 4);
    });
});

describe('dateTimeTypeNode', () => {
    test('it delegates to the underlying number type', () => {
        expectMaxSize(dateTimeTypeNode(numberTypeNode('u64')), 8);
        expectMaxSize(dateTimeTypeNode(numberTypeNode('shortU16')), 3);
    });
});

describe('definedTypeNode', () => {
    test('it returns the size of the inner type', () => {
        expectMaxSize(definedTypeNode({ name: 'withMaxSize', type: numberTypeNode('shortU16') }), 3);
        expectMaxSize(definedTypeNode({ name: 'withoutMaxSize', type: stringTypeNode('utf8') }), null);
    });
});

describe('definedTypeLinkNode', () => {
    test('it returns the max size of the type being linked', () => {
        const context = programNode({
            definedTypes: [definedTypeNode({ name: 'myType', type: numberTypeNode('shortU16') })],
            name: 'myProgram',
            publicKey: '1111',
        });

        expectMaxSizeWithContext([context, definedTypeLinkNode('myType')], 3);
    });
    test('it returns null if the linked type has no max size', () => {
        const context = programNode({
            definedTypes: [definedTypeNode({ name: 'myType', type: stringTypeNode('utf8') })],
            name: 'myProgram',
            publicKey: '1111',
        });

        expectMaxSizeWithContext([context, definedTypeLinkNode('myType')], null);
    });
    test('it returns null if the linked type cannot be found', () => {
        const context = programNode({ name: 'myProgram', publicKey: '1111' });
        expectMaxSizeWithContext([context, definedTypeLinkNode('myMissingType')], null);
    });
    test('it returns null if the linked type is circular', () => {
        const context = programNode({
            definedTypes: [definedTypeNode({ name: 'myType', type: definedTypeLinkNode('myType') })],
            name: 'myProgram',
            publicKey: '1111',
        });

        expectMaxSizeWithContext([context, definedTypeLinkNode('myType')], null);
    });
    test('it follows linked nodes using the correct paths when jumping between programs', () => {
        const programA = programNode({
            definedTypes: [
                definedTypeNode({
                    name: 'typeA',
                    type: definedTypeLinkNode('typeB1', programLinkNode('programB')),
                }),
            ],
            name: 'programA',
            publicKey: '1111',
        });
        const programB = programNode({
            definedTypes: [
                definedTypeNode({ name: 'typeB1', type: definedTypeLinkNode('typeB2') }),
                definedTypeNode({ name: 'typeB2', type: numberTypeNode('shortU16') }),
            ],
            name: 'programB',
            publicKey: '2222',
        });
        const context = rootNode(programA, [programB]);

        expectMaxSizeWithContext([context, programA, programA.definedTypes[0]], 3);
    });
});

describe('enumTypeNode', () => {
    test('it returns 1 by default for scalar enums', () => {
        expectMaxSize(
            enumTypeNode([enumEmptyVariantTypeNode('A'), enumEmptyVariantTypeNode('B'), enumEmptyVariantTypeNode('C')]),
            1,
        );
    });
    test('it returns the custom size for scalar enums', () => {
        expectMaxSize(
            enumTypeNode(
                [enumEmptyVariantTypeNode('A'), enumEmptyVariantTypeNode('B'), enumEmptyVariantTypeNode('C')],
                { size: numberTypeNode('shortU16') },
            ),
            3,
        );
    });
    test('it returns the size of the largest variant plus the prefix', () => {
        expectMaxSize(
            enumTypeNode(
                [
                    enumTupleVariantTypeNode('A', tupleTypeNode([numberTypeNode('u16')])), // 2 bytes
                    enumTupleVariantTypeNode('B', tupleTypeNode([numberTypeNode('u32')])), // 4 bytes
                ],
                { size: numberTypeNode('u64') },
            ),
            8 + 4,
        );
    });
    test('it returns null if at least one variant has no max size', () => {
        expectMaxSize(enumTypeNode([enumTupleVariantTypeNode('A', tupleTypeNode([stringTypeNode('utf8')]))]), null);
    });
});

describe('fixedSizeTypeNode', () => {
    test('it returns the fixed size assigned on the node', () => {
        expectMaxSize(fixedSizeTypeNode(numberTypeNode('u8'), 32), 32);
        expectMaxSize(fixedSizeTypeNode(stringTypeNode('utf8'), 32), 32);
    });
});

describe('hiddenPrefixTypeNode', () => {
    test('it returns the sum of all prefixes and the inner item if all of them have a max size', () => {
        const prefix1 = constantValueNodeFromString('base16', '2222');
        const prefix2 = constantValueNodeFromString('base16', '333333');
        expectMaxSize(hiddenPrefixTypeNode(numberTypeNode('shortU16'), [prefix1, prefix2]), 2 + 3 + 3);
    });
    test('it returns null if the inner item has no max size', () => {
        const prefix = constantValueNodeFromString('base16', 'ffff');
        expectMaxSize(hiddenPrefixTypeNode(stringTypeNode('utf8'), [prefix]), null);
    });
});

describe('hiddenSuffixTypeNode', () => {
    test('it returns the sum of all suffixes and the inner item if all of them have a max size', () => {
        const suffix1 = constantValueNodeFromString('base16', '2222');
        const suffix2 = constantValueNodeFromString('base16', '333333');
        expectMaxSize(hiddenSuffixTypeNode(numberTypeNode('shortU16'), [suffix1, suffix2]), 3 + 2 + 3);
    });
    test('it returns null if the inner item has no max size', () => {
        const suffix = constantValueNodeFromString('base16', 'ffff');
        expectMaxSize(hiddenSuffixTypeNode(stringTypeNode('utf8'), [suffix]), null);
    });
});

describe('instructionNode', () => {
    test('it returns the total max size of all arguments in the instruction', () => {
        expectMaxSize(
            instructionNode({
                arguments: [
                    instructionArgumentNode({ name: 'lamports', type: optionTypeNode(numberTypeNode('u64')) }),
                    instructionArgumentNode({ name: 'space', type: numberTypeNode('shortU16') }),
                ],
                name: 'createAccount',
            }),
            9 + 3,
        );
    });
    test('it returns null if any argument has no max size', () => {
        expectMaxSize(
            instructionNode({
                arguments: [
                    instructionArgumentNode({ name: 'lamports', type: numberTypeNode('u64') }),
                    instructionArgumentNode({ name: 'name', type: stringTypeNode('utf8') }),
                ],
                name: 'createAccount',
            }),
            null,
        );
    });
});

describe('instructionArgumentNode', () => {
    test('it returns the max size of the argument type', () => {
        expectMaxSize(instructionArgumentNode({ name: 'lamports', type: numberTypeNode('shortU16') }), 3);
    });
});

describe('mapTypeNode', () => {
    test('it multiplies the max size of the inner item with the fixed count', () => {
        const key = numberTypeNode('u8');
        const value = optionTypeNode(numberTypeNode('u16'));
        expectMaxSize(mapTypeNode(key, value, fixedCountNode(4)), (1 + 3) * 4);
    });
    test('it returns 0 if the count is 0 and the inner type is unsized', () => {
        const key = stringTypeNode('utf8');
        const value = numberTypeNode('u16');
        expectMaxSize(mapTypeNode(key, value, fixedCountNode(0)), 0);
    });
    test('it returns null if the count is not fixed', () => {
        const key = numberTypeNode('u8');
        const value = numberTypeNode('u16');
        expectMaxSize(mapTypeNode(key, value, prefixedCountNode(numberTypeNode('u8'))), null);
        expectMaxSize(mapTypeNode(key, value, remainderCountNode()), null);
    });
    test('it returns null if the inner type has no max size', () => {
        const key = numberTypeNode('u8');
        const value = stringTypeNode('utf8');
        expectMaxSize(mapTypeNode(key, value, fixedCountNode(3)), null);
        expectMaxSize(mapTypeNode(key, value, prefixedCountNode(numberTypeNode('u8'))), null);
        expectMaxSize(mapTypeNode(key, value, remainderCountNode()), null);
    });
    test('it returns 0 if the inner type max size is 0 and the count is fixed', () => {
        const zeroSizeType = tupleTypeNode([]);
        expectMaxSize(mapTypeNode(zeroSizeType, zeroSizeType, fixedCountNode(3)), 0);
    });
    test('it returns 0 if the inner type max size is 0 and the count is remainder', () => {
        const zeroSizeType = tupleTypeNode([]);
        expectMaxSize(mapTypeNode(zeroSizeType, zeroSizeType, remainderCountNode()), 0);
    });
    test('it returns the prefix max size if the inner type size is 0 and the count is prefixed', () => {
        const zeroSizeType = tupleTypeNode([]);
        expectMaxSize(mapTypeNode(zeroSizeType, zeroSizeType, prefixedCountNode(numberTypeNode('u32'))), 4);
        expectMaxSize(mapTypeNode(zeroSizeType, zeroSizeType, prefixedCountNode(numberTypeNode('shortU16'))), 3);
    });
});

describe('numberTypeNode', () => {
    test.each([
        ['u8', 1],
        ['i8', 1],
        ['u16', 2],
        ['i16', 2],
        ['u32', 4],
        ['i32', 4],
        ['u64', 8],
        ['i64', 8],
        ['u128', 16],
        ['i128', 16],
        ['f32', 4],
        ['f64', 8],
        ['shortU16', 3],
    ])('it returns the size of %s numbers', (format, expectedSize) => {
        expectMaxSize(numberTypeNode(format as NumberFormat), expectedSize);
    });
});

describe('optionTypeNode', () => {
    test('it returns the max size of the inner item plus 1 by default', () => {
        expectMaxSize(optionTypeNode(numberTypeNode('u32')), 1 + 4);
        expectMaxSize(optionTypeNode(numberTypeNode('u32'), { fixed: true }), 1 + 4);
    });
    test('it returns the sum of the prefix and inner item max sizes', () => {
        expectMaxSize(optionTypeNode(numberTypeNode('u32'), { prefix: numberTypeNode('u16') }), 2 + 4);
        expectMaxSize(optionTypeNode(numberTypeNode('u32'), { fixed: true, prefix: numberTypeNode('u16') }), 2 + 4);
    });
});

describe('postOffsetTypeNode', () => {
    test('it increases the max size by the offset when using a padded offset', () => {
        expectMaxSize(postOffsetTypeNode(numberTypeNode('shortU16'), 10, 'padded'), 13);
    });
    test('it returns null if the inner item is has no max size', () => {
        expectMaxSize(postOffsetTypeNode(stringTypeNode('utf8'), 4, 'padded'), null);
    });
    test('it returns the max size of the inner item for other offset strategies', () => {
        // Fixed.
        expectMaxSize(postOffsetTypeNode(numberTypeNode('shortU16'), 42), 3);
        expectMaxSize(postOffsetTypeNode(numberTypeNode('shortU16'), 42, 'absolute'), 3);
        expectMaxSize(postOffsetTypeNode(numberTypeNode('shortU16'), 42, 'preOffset'), 3);
        expectMaxSize(postOffsetTypeNode(numberTypeNode('shortU16'), 42, 'relative'), 3);

        // Variable.
        expectMaxSize(postOffsetTypeNode(stringTypeNode('utf8'), 42), null);
        expectMaxSize(postOffsetTypeNode(stringTypeNode('utf8'), 42, 'absolute'), null);
        expectMaxSize(postOffsetTypeNode(stringTypeNode('utf8'), 42, 'preOffset'), null);
        expectMaxSize(postOffsetTypeNode(stringTypeNode('utf8'), 42, 'relative'), null);
    });
});

describe('preOffsetTypeNode', () => {
    test('it increases the max size by the offset when using a padded offset', () => {
        expectMaxSize(preOffsetTypeNode(numberTypeNode('shortU16'), 10, 'padded'), 13);
    });
    test('it returns null if the inner item has no max size', () => {
        expectMaxSize(preOffsetTypeNode(stringTypeNode('utf8'), 4, 'padded'), null);
    });
    test('it returns the max size of the inner item for other offset strategies', () => {
        // Fixed.
        expectMaxSize(preOffsetTypeNode(numberTypeNode('shortU16'), 42), 3);
        expectMaxSize(preOffsetTypeNode(numberTypeNode('shortU16'), 42, 'absolute'), 3);
        expectMaxSize(preOffsetTypeNode(numberTypeNode('shortU16'), 42, 'relative'), 3);

        // Variable.
        expectMaxSize(preOffsetTypeNode(stringTypeNode('utf8'), 42), null);
        expectMaxSize(preOffsetTypeNode(stringTypeNode('utf8'), 42, 'absolute'), null);
        expectMaxSize(preOffsetTypeNode(stringTypeNode('utf8'), 42, 'relative'), null);
    });
});

describe('publicKeyTypeNode', () => {
    test('it returns 32', () => {
        expectMaxSize(publicKeyTypeNode(), 32);
    });
});

describe('remainderOptionTypeNode', () => {
    test('it returns 0 if the inner item max size is also 0', () => {
        expectMaxSize(remainderOptionTypeNode(tupleTypeNode([])), 0);
    });
    test('it returns null in all other cases', () => {
        expectMaxSize(remainderOptionTypeNode(numberTypeNode('u16')), null);
        expectMaxSize(remainderOptionTypeNode(stringTypeNode('utf8')), null);
    });
});

describe('sentinelTypeNode', () => {
    test('it returns the sum of the inner type and the sentinel max sizes if both of them exist', () => {
        const sentinel = constantValueNodeFromString('base16', 'ffff');
        expectMaxSize(sentinelTypeNode(numberTypeNode('shortU16'), sentinel), 2 + 3);
    });
    test('it returns null if the inner type has no max size', () => {
        const sentinel = constantValueNodeFromString('base16', 'ffff');
        expectMaxSize(sentinelTypeNode(stringTypeNode('utf8'), sentinel), null);
    });
});

describe('setTypeNode', () => {
    test('it multiplies the max size of the inner item with the fixed count', () => {
        expectMaxSize(setTypeNode(optionTypeNode(numberTypeNode('u32')), fixedCountNode(3)), 5 * 3);
    });
    test('it returns 0 if the count is 0 and the inner type is unsized', () => {
        expectMaxSize(setTypeNode(stringTypeNode('utf8'), fixedCountNode(0)), 0);
    });
    test('it returns null if the count is not fixed', () => {
        expectMaxSize(setTypeNode(numberTypeNode('u16'), prefixedCountNode(numberTypeNode('u8'))), null);
        expectMaxSize(setTypeNode(numberTypeNode('u16'), remainderCountNode()), null);
    });
    test('it returns null if the inner type has no max size', () => {
        expectMaxSize(setTypeNode(stringTypeNode('utf8'), fixedCountNode(3)), null);
        expectMaxSize(setTypeNode(stringTypeNode('utf8'), prefixedCountNode(numberTypeNode('u8'))), null);
        expectMaxSize(setTypeNode(stringTypeNode('utf8'), remainderCountNode()), null);
    });
    test('it returns 0 if the inner type max size is 0 and the count is fixed', () => {
        expectMaxSize(setTypeNode(tupleTypeNode([]), fixedCountNode(3)), 0);
    });
    test('it returns 0 if the inner type max size is 0 and the count is remainder', () => {
        expectMaxSize(setTypeNode(tupleTypeNode([]), remainderCountNode()), 0);
    });
    test('it returns the prefix max size if the inner type size is 0 and the count is prefixed', () => {
        expectMaxSize(setTypeNode(tupleTypeNode([]), prefixedCountNode(numberTypeNode('u32'))), 4);
        expectMaxSize(setTypeNode(tupleTypeNode([]), prefixedCountNode(numberTypeNode('shortU16'))), 3);
    });
});

describe('sizePrefixTypeNode', () => {
    test('it returns the max size of the prefix if the inner type size is 0', () => {
        expectMaxSize(sizePrefixTypeNode(tupleTypeNode([]), numberTypeNode('shortU16')), 3);
    });
    test('it returns the sum of the prefix and the inner type max sizes if they both exist', () => {
        expectMaxSize(sizePrefixTypeNode(optionTypeNode(publicKeyTypeNode()), numberTypeNode('shortU16')), 3 + 33);
    });
    test('it returns null if the inner type has no max size', () => {
        expectMaxSize(sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32')), null);
    });
});

describe('solAmountTypeNode', () => {
    test('it delegates to the underlying number type', () => {
        expectMaxSize(solAmountTypeNode(numberTypeNode('u64')), 8);
        expectMaxSize(solAmountTypeNode(numberTypeNode('shortU16')), 3);
    });
});

describe('stringTypeNode', () => {
    test('it always returns null', () => {
        expectMaxSize(stringTypeNode('base16'), null);
        expectMaxSize(stringTypeNode('base58'), null);
        expectMaxSize(stringTypeNode('base64'), null);
        expectMaxSize(stringTypeNode('utf8'), null);
    });
});

describe('structFieldTypeNode', () => {
    test('it returns the max size of the inner type', () => {
        expectMaxSize(structFieldTypeNode({ name: 'withMaxSize', type: numberTypeNode('shortU16') }), 3);
        expectMaxSize(structFieldTypeNode({ name: 'withoutMaxSize', type: stringTypeNode('utf8') }), null);
    });
});

describe('structTypeNode', () => {
    test('it returns the sum of the field max sizes if they all have one', () => {
        expectMaxSize(
            structTypeNode([
                structFieldTypeNode({ name: 'age', type: numberTypeNode('shortU16') }),
                structFieldTypeNode({
                    name: 'firstname',
                    type: optionTypeNode(fixedSizeTypeNode(stringTypeNode('utf8'), 42)),
                }),
            ]),
            3 + 43,
        );
    });
    test('it returns null if any field has no max size', () => {
        expectMaxSize(
            structTypeNode([
                structFieldTypeNode({ name: 'age', type: numberTypeNode('u32') }),
                structFieldTypeNode({ name: 'firstname', type: stringTypeNode('utf8') }),
            ]),
            null,
        );
    });
});

describe('tupleTypeNode', () => {
    test('it returns the sum of all max sizes if all items have one', () => {
        expectMaxSize(tupleTypeNode([numberTypeNode('shortU16'), optionTypeNode(numberTypeNode('u32'))]), 3 + 5);
    });
    test('it returns null if any item has no max size', () => {
        expectMaxSize(tupleTypeNode([numberTypeNode('u16'), stringTypeNode('utf8')]), null);
    });
});

describe('zeroableOptionTypeNode', () => {
    test('it returns the inner item max size if is has one', () => {
        expectMaxSize(zeroableOptionTypeNode(numberTypeNode('shortU16')), 3);
    });
    test('it returns null if the inner item has no max size', () => {
        expectMaxSize(zeroableOptionTypeNode(stringTypeNode('utf8')), null);
    });
    test('it returns the maximum value between the inner item max size and the zero value when provided', () => {
        const zeroValue = (bytes: number) => constantValueNodeFromString('base16', 'ff'.repeat(bytes));
        expectMaxSize(zeroableOptionTypeNode(numberTypeNode('u32'), zeroValue(2)), 4);
        expectMaxSize(zeroableOptionTypeNode(numberTypeNode('u32'), zeroValue(42)), 42);
    });
});
