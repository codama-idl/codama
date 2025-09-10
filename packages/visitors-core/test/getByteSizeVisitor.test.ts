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
    enumStructVariantTypeNode,
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
    getByteSizeVisitor,
    getLastNodeFromPath,
    getRecordLinkablesVisitor,
    LinkableDictionary,
    NodePath,
    NodeStack,
    visit,
} from '../src';

const expectSize = (
    node: GetNodeFromKind<ByteSizeVisitorKeys>,
    expectedSize: number | null,
    linkables?: LinkableDictionary,
    stack?: NodeStack,
) => {
    expect(visit(node, getByteSizeVisitor(linkables ?? new LinkableDictionary(), { stack }))).toBe(expectedSize);
};

const expectSizeWithContext = (
    nodePath: NodePath<GetNodeFromKind<ByteSizeVisitorKeys>>,
    expectedSize: number | null,
) => {
    const node = getLastNodeFromPath(nodePath);
    const stack = new NodeStack(nodePath.slice(0, -1));
    const linkables = new LinkableDictionary();
    visit(nodePath[0], getRecordLinkablesVisitor(linkables));
    expectSize(node, expectedSize, linkables, stack);
};

describe('accountNode', () => {
    test('it returns the size of the account data', () => {
        expectSize(
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({ name: 'mint', type: publicKeyTypeNode() }),
                    structFieldTypeNode({ name: 'owner', type: publicKeyTypeNode() }),
                    structFieldTypeNode({ name: 'amount', type: numberTypeNode('u64') }),
                ]),
                name: 'token',
            }),
            32 + 32 + 8,
        );
    });
});

describe('amountTypeNode', () => {
    test('it delegates to the underlying number type', () => {
        expectSize(amountTypeNode(numberTypeNode('u64'), 2, 'GBP'), 8);
        expectSize(amountTypeNode(numberTypeNode('shortU16'), 2, 'GBP'), null);
    });
});

describe('arrayTypeNode', () => {
    test('it returns a size if the count is fixed and the inner type is sized', () => {
        expectSize(arrayTypeNode(numberTypeNode('u16'), fixedCountNode(3)), 2 * 3);
    });
    test('it returns 0 if the count is 0 and the inner type is unsized', () => {
        expectSize(arrayTypeNode(stringTypeNode('utf8'), fixedCountNode(0)), 0);
    });
    test('it returns null if the count is not fixed', () => {
        expectSize(arrayTypeNode(numberTypeNode('u16'), prefixedCountNode(numberTypeNode('u8'))), null);
        expectSize(arrayTypeNode(numberTypeNode('u16'), remainderCountNode()), null);
    });
    test('it returns null if the inner type is unsized', () => {
        expectSize(arrayTypeNode(stringTypeNode('utf8'), fixedCountNode(3)), null);
        expectSize(arrayTypeNode(stringTypeNode('utf8'), prefixedCountNode(numberTypeNode('u8'))), null);
        expectSize(arrayTypeNode(stringTypeNode('utf8'), remainderCountNode()), null);
    });
    test('it returns 0 if the inner type size is 0 and the count is fixed', () => {
        expectSize(arrayTypeNode(tupleTypeNode([]), fixedCountNode(3)), 0);
    });
    test('it returns 0 if the inner type size is 0 and the count is remainder', () => {
        expectSize(arrayTypeNode(tupleTypeNode([]), remainderCountNode()), 0);
    });
    test('it returns the prefix size if the inner type size is 0 and the count is prefixed', () => {
        expectSize(arrayTypeNode(tupleTypeNode([]), prefixedCountNode(numberTypeNode('u32'))), 4);
        expectSize(arrayTypeNode(tupleTypeNode([]), prefixedCountNode(numberTypeNode('shortU16'))), null);
    });
});

describe('booleanTypeNode', () => {
    test('it returns 1 by default', () => {
        expectSize(booleanTypeNode(), 1);
    });
    test('it delegates to the custom boolean size otherwise', () => {
        expectSize(booleanTypeNode(numberTypeNode('u64')), 8);
        expectSize(booleanTypeNode(numberTypeNode('shortU16')), null);
    });
});

describe('bytesTypeNode', () => {
    test('it always returns null', () => {
        expectSize(bytesTypeNode(), null);
    });
});

describe('constantValueNode', () => {
    test('it returns the type size if fixed', () => {
        expectSize(constantValueNode(numberTypeNode('u32'), numberValueNode(42)), 4);
        expectSize(constantValueNode(fixedSizeTypeNode(stringTypeNode('utf8'), 42), stringValueNode('Hello')), 42);
    });
    test('it returns the size of byte value nodes when used with a base16 encoding', () => {
        expectSize(constantValueNode(bytesTypeNode(), bytesValueNode('base16', '11223344')), 4);
    });
    test('it returns the size of string value nodes when used with a base16 encoding', () => {
        expectSize(constantValueNode(stringTypeNode('base16'), stringValueNode('11223344')), 4);
    });
});

describe('dateTimeTypeNode', () => {
    test('it delegates to the underlying number type', () => {
        expectSize(dateTimeTypeNode(numberTypeNode('u64')), 8);
        expectSize(dateTimeTypeNode(numberTypeNode('shortU16')), null);
    });
});

describe('definedTypeNode', () => {
    test('it returns the size of the inner type', () => {
        expectSize(definedTypeNode({ name: 'fixed', type: numberTypeNode('u32') }), 4);
        expectSize(definedTypeNode({ name: 'variable', type: stringTypeNode('utf8') }), null);
    });
});

describe('definedTypeLinkNode', () => {
    test('it returns the size of the type being linked', () => {
        const context = programNode({
            definedTypes: [definedTypeNode({ name: 'myType', type: numberTypeNode('u64') })],
            name: 'myProgram',
            publicKey: '1111',
        });

        expectSizeWithContext([context, definedTypeLinkNode('myType')], 8);
    });
    test('it returns null if the linked type is variable', () => {
        const context = programNode({
            definedTypes: [definedTypeNode({ name: 'myType', type: stringTypeNode('utf8') })],
            name: 'myProgram',
            publicKey: '1111',
        });

        expectSizeWithContext([context, definedTypeLinkNode('myType')], null);
    });
    test('it returns null if the linked type cannot be found', () => {
        const context = programNode({ name: 'myProgram', publicKey: '1111' });
        expectSizeWithContext([context, definedTypeLinkNode('myMissingType')], null);
    });
    test('it returns null if the linked type is circular', () => {
        const context = programNode({
            definedTypes: [definedTypeNode({ name: 'myType', type: definedTypeLinkNode('myType') })],
            name: 'myProgram',
            publicKey: '1111',
        });

        expectSizeWithContext([context, definedTypeLinkNode('myType')], null);
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
                definedTypeNode({ name: 'typeB2', type: numberTypeNode('u64') }),
            ],
            name: 'programB',
            publicKey: '2222',
        });
        const context = rootNode(programA, [programB]);

        expectSizeWithContext([context, programA, programA.definedTypes[0]], 8);
    });
});

describe('enumTypeNode', () => {
    test('it returns 1 by default for scalar enums', () => {
        expectSize(
            enumTypeNode([enumEmptyVariantTypeNode('A'), enumEmptyVariantTypeNode('B'), enumEmptyVariantTypeNode('C')]),
            1,
        );
    });
    test('it returns the custom size for scalar enums', () => {
        expectSize(
            enumTypeNode(
                [enumEmptyVariantTypeNode('A'), enumEmptyVariantTypeNode('B'), enumEmptyVariantTypeNode('C')],
                { size: numberTypeNode('u64') },
            ),
            8,
        );
    });
    test('it returns a fixed size for data enums if all variants are the same fixed size', () => {
        expectSize(
            enumTypeNode(
                [
                    // 4 bytes
                    enumTupleVariantTypeNode('A', tupleTypeNode([numberTypeNode('u32')])),
                    // 4 bytes
                    enumStructVariantTypeNode(
                        'B',
                        structTypeNode([
                            structFieldTypeNode({ name: 'x', type: numberTypeNode('u16') }),
                            structFieldTypeNode({ name: 'y', type: numberTypeNode('u16') }),
                        ]),
                    ),
                ],
                // 8 bytes prefix
                { size: numberTypeNode('u64') },
            ),
            8 + 4,
        );
    });
    test('it returns null if variants have different sizes', () => {
        expectSize(
            enumTypeNode([
                enumTupleVariantTypeNode('A', tupleTypeNode([numberTypeNode('u16')])), // 2 bytes
                enumTupleVariantTypeNode('B', tupleTypeNode([numberTypeNode('u32')])), // 4 bytes
            ]),
            null,
        );
    });
    test('it returns null if at least one variant is unsized', () => {
        expectSize(enumTypeNode([enumTupleVariantTypeNode('A', tupleTypeNode([stringTypeNode('utf8')]))]), null);
    });
});

describe('fixedSizeTypeNode', () => {
    test('it returns the fixed size assigned on the node', () => {
        expectSize(fixedSizeTypeNode(numberTypeNode('u8'), 32), 32);
        expectSize(fixedSizeTypeNode(stringTypeNode('utf8'), 32), 32);
    });
});

describe('hiddenPrefixTypeNode', () => {
    test('it returns the sum of all prefixes and the inner item if all of them are fixed', () => {
        const prefix1 = constantValueNodeFromString('base16', '2222');
        const prefix2 = constantValueNodeFromString('base16', '333333');
        expectSize(hiddenPrefixTypeNode(numberTypeNode('u32'), [prefix1, prefix2]), 2 + 3 + 4);
    });
    test('it returns null if the inner item is variable', () => {
        const prefix = constantValueNodeFromString('base16', 'ffff');
        expectSize(hiddenPrefixTypeNode(stringTypeNode('utf8'), [prefix]), null);
    });
});

describe('hiddenSuffixTypeNode', () => {
    test('it returns the sum of all suffixes and the inner item if all of them are fixed', () => {
        const suffix1 = constantValueNodeFromString('base16', '2222');
        const suffix2 = constantValueNodeFromString('base16', '333333');
        expectSize(hiddenSuffixTypeNode(numberTypeNode('u32'), [suffix1, suffix2]), 4 + 2 + 3);
    });
    test('it returns null if the inner item is variable', () => {
        const suffix = constantValueNodeFromString('base16', 'ffff');
        expectSize(hiddenSuffixTypeNode(stringTypeNode('utf8'), [suffix]), null);
    });
});

describe('instructionNode', () => {
    test('it returns the total size of all arguments in the instruction', () => {
        expectSize(
            instructionNode({
                arguments: [
                    instructionArgumentNode({ name: 'lamports', type: numberTypeNode('u64') }),
                    instructionArgumentNode({ name: 'space', type: numberTypeNode('u32') }),
                ],
                name: 'createAccount',
            }),
            8 + 4,
        );
    });
    test('it returns null if any argument is unsized', () => {
        expectSize(
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
    test('it returns the size of the argument type', () => {
        expectSize(instructionArgumentNode({ name: 'lamports', type: numberTypeNode('u64') }), 8);
    });
});

describe('mapTypeNode', () => {
    test('it returns a size if the count is fixed and the inner type is sized', () => {
        const key = numberTypeNode('u8'); // Fixed
        const value = numberTypeNode('u16'); // Fixed
        expectSize(mapTypeNode(key, value, fixedCountNode(3)), (1 + 2) * 3);
    });
    test('it returns 0 if the count is 0 and the inner type is unsized', () => {
        const key = stringTypeNode('utf8'); // Variable
        const value = numberTypeNode('u16'); // Fixed
        expectSize(mapTypeNode(key, value, fixedCountNode(0)), 0);
    });
    test('it returns null if the count is not fixed', () => {
        const key = numberTypeNode('u8'); // Fixed
        const value = numberTypeNode('u16'); // Fixed
        expectSize(mapTypeNode(key, value, prefixedCountNode(numberTypeNode('u8'))), null);
        expectSize(mapTypeNode(key, value, remainderCountNode()), null);
    });
    test('it returns null if the inner type is unsized', () => {
        const key = numberTypeNode('u8');
        const value = stringTypeNode('utf8');
        expectSize(mapTypeNode(key, value, fixedCountNode(3)), null);
        expectSize(mapTypeNode(key, value, prefixedCountNode(numberTypeNode('u8'))), null);
        expectSize(mapTypeNode(key, value, remainderCountNode()), null);
    });
    test('it returns 0 if the inner type size is 0 and the count is fixed', () => {
        const zeroSizeType = tupleTypeNode([]);
        expectSize(mapTypeNode(zeroSizeType, zeroSizeType, fixedCountNode(3)), 0);
    });
    test('it returns 0 if the inner type size is 0 and the count is remainder', () => {
        const zeroSizeType = tupleTypeNode([]);
        expectSize(mapTypeNode(zeroSizeType, zeroSizeType, remainderCountNode()), 0);
    });
    test('it returns the prefix size if the inner type size is 0 and the count is prefixed', () => {
        const zeroSizeType = tupleTypeNode([]);
        expectSize(mapTypeNode(zeroSizeType, zeroSizeType, prefixedCountNode(numberTypeNode('u32'))), 4);
        expectSize(mapTypeNode(zeroSizeType, zeroSizeType, prefixedCountNode(numberTypeNode('shortU16'))), null);
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
    ])('it returns the size of %s numbers', (format, expectedSize) => {
        expectSize(numberTypeNode(format as NumberFormat), expectedSize);
    });
});

describe('optionTypeNode', () => {
    test('it returns the sum of the prefix and the inner item sizes if both of them are fixed', () => {
        expectSize(optionTypeNode(numberTypeNode('u32'), { fixed: true }), 5);
        expectSize(optionTypeNode(numberTypeNode('u32'), { fixed: true, prefix: numberTypeNode('u16') }), 6);
    });
    test('it returns null if the inner item is not fixed', () => {
        expectSize(optionTypeNode(stringTypeNode('utf8'), { fixed: true }), null);
    });
    test('it returns null if the prefixed is not fixed', () => {
        expectSize(optionTypeNode(numberTypeNode('u32'), { fixed: true, prefix: numberTypeNode('shortU16') }), null);
    });
    test('it returns null if the option is not fixed', () => {
        expectSize(optionTypeNode(numberTypeNode('u32')), null);
        expectSize(optionTypeNode(numberTypeNode('u32'), { prefix: numberTypeNode('u16') }), null);
    });
});

describe('postOffsetTypeNode', () => {
    test('it increases the size by the offset when using a padded offset', () => {
        expectSize(postOffsetTypeNode(numberTypeNode('u16'), 10, 'padded'), 12);
    });
    test('it returns null if the inner item is not fixed', () => {
        expectSize(postOffsetTypeNode(stringTypeNode('utf8'), 4, 'padded'), null);
    });
    test('it returns the size of the inner item for other offset strategies', () => {
        // Fixed.
        expectSize(postOffsetTypeNode(numberTypeNode('u8'), 42), 1);
        expectSize(postOffsetTypeNode(numberTypeNode('u8'), 42, 'absolute'), 1);
        expectSize(postOffsetTypeNode(numberTypeNode('u8'), 42, 'preOffset'), 1);
        expectSize(postOffsetTypeNode(numberTypeNode('u8'), 42, 'relative'), 1);

        // Variable.
        expectSize(postOffsetTypeNode(stringTypeNode('utf8'), 42), null);
        expectSize(postOffsetTypeNode(stringTypeNode('utf8'), 42, 'absolute'), null);
        expectSize(postOffsetTypeNode(stringTypeNode('utf8'), 42, 'preOffset'), null);
        expectSize(postOffsetTypeNode(stringTypeNode('utf8'), 42, 'relative'), null);
    });
});

describe('preOffsetTypeNode', () => {
    test('it increases the size by the offset when using a padded offset', () => {
        expectSize(preOffsetTypeNode(numberTypeNode('u16'), 10, 'padded'), 12);
    });
    test('it returns null if the inner item is not fixed', () => {
        expectSize(preOffsetTypeNode(stringTypeNode('utf8'), 4, 'padded'), null);
    });
    test('it returns the size of the inner item for other offset strategies', () => {
        // Fixed.
        expectSize(preOffsetTypeNode(numberTypeNode('u8'), 42), 1);
        expectSize(preOffsetTypeNode(numberTypeNode('u8'), 42, 'absolute'), 1);
        expectSize(preOffsetTypeNode(numberTypeNode('u8'), 42, 'relative'), 1);

        // Variable.
        expectSize(preOffsetTypeNode(stringTypeNode('utf8'), 42), null);
        expectSize(preOffsetTypeNode(stringTypeNode('utf8'), 42, 'absolute'), null);
        expectSize(preOffsetTypeNode(stringTypeNode('utf8'), 42, 'relative'), null);
    });
});

describe('publicKeyTypeNode', () => {
    test('it returns 32', () => {
        expectSize(publicKeyTypeNode(), 32);
    });
});

describe('remainderOptionTypeNode', () => {
    test('it returns 0 if the inner item size is also 0', () => {
        expectSize(remainderOptionTypeNode(tupleTypeNode([])), 0);
    });
    test('it returns null in all other cases', () => {
        expectSize(remainderOptionTypeNode(numberTypeNode('u16')), null);
        expectSize(remainderOptionTypeNode(stringTypeNode('utf8')), null);
    });
});

describe('sentinelTypeNode', () => {
    test('it returns the inner type and the sentinel size if both of them are fixed', () => {
        const sentinel = constantValueNodeFromString('base16', 'ffff');
        expectSize(sentinelTypeNode(numberTypeNode('u32'), sentinel), 6);
    });
    test('it returns null if the inner type is variable', () => {
        const sentinel = constantValueNodeFromString('base16', 'ffff');
        expectSize(sentinelTypeNode(stringTypeNode('utf8'), sentinel), null);
    });
});

describe('setTypeNode', () => {
    test('it returns a size if the count is fixed and the inner type is sized', () => {
        expectSize(setTypeNode(numberTypeNode('u16'), fixedCountNode(3)), 2 * 3);
    });
    test('it returns 0 if the count is 0 and the inner type is unsized', () => {
        expectSize(setTypeNode(stringTypeNode('utf8'), fixedCountNode(0)), 0);
    });
    test('it returns null if the count is not fixed', () => {
        expectSize(setTypeNode(numberTypeNode('u16'), prefixedCountNode(numberTypeNode('u8'))), null);
        expectSize(setTypeNode(numberTypeNode('u16'), remainderCountNode()), null);
    });
    test('it returns null if the inner type is unsized', () => {
        expectSize(setTypeNode(stringTypeNode('utf8'), fixedCountNode(3)), null);
        expectSize(setTypeNode(stringTypeNode('utf8'), prefixedCountNode(numberTypeNode('u8'))), null);
        expectSize(setTypeNode(stringTypeNode('utf8'), remainderCountNode()), null);
    });
    test('it returns 0 if the inner type size is 0 and the count is fixed', () => {
        expectSize(setTypeNode(tupleTypeNode([]), fixedCountNode(3)), 0);
    });
    test('it returns 0 if the inner type size is 0 and the count is remainder', () => {
        expectSize(setTypeNode(tupleTypeNode([]), remainderCountNode()), 0);
    });
    test('it returns the prefix size if the inner type size is 0 and the count is prefixed', () => {
        expectSize(setTypeNode(tupleTypeNode([]), prefixedCountNode(numberTypeNode('u32'))), 4);
        expectSize(setTypeNode(tupleTypeNode([]), prefixedCountNode(numberTypeNode('shortU16'))), null);
    });
});

describe('sizePrefixTypeNode', () => {
    test('it returns the size of the size prefix if the inner type size is 0', () => {
        expectSize(sizePrefixTypeNode(tupleTypeNode([]), numberTypeNode('u32')), 4);
    });
    test('it returns the sum of the prefix and the inner type if both are fixed', () => {
        expectSize(sizePrefixTypeNode(publicKeyTypeNode(), numberTypeNode('u32')), 4 + 32);
    });
    test('it returns null if the inner type is variable', () => {
        expectSize(sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32')), null);
    });
});

describe('solAmountTypeNode', () => {
    test('it delegates to the underlying number type', () => {
        expectSize(solAmountTypeNode(numberTypeNode('u64')), 8);
        expectSize(solAmountTypeNode(numberTypeNode('shortU16')), null);
    });
});

describe('stringTypeNode', () => {
    test('it always returns null', () => {
        expectSize(stringTypeNode('base16'), null);
        expectSize(stringTypeNode('base58'), null);
        expectSize(stringTypeNode('base64'), null);
        expectSize(stringTypeNode('utf8'), null);
    });
});

describe('structFieldTypeNode', () => {
    test('it returns the size of the inner type', () => {
        expectSize(structFieldTypeNode({ name: 'fixed', type: numberTypeNode('u32') }), 4);
        expectSize(structFieldTypeNode({ name: 'variable', type: stringTypeNode('utf8') }), null);
    });
});

describe('structTypeNode', () => {
    test('it returns the sum of fields if all fields are fixed size', () => {
        expectSize(
            structTypeNode([
                structFieldTypeNode({ name: 'age', type: numberTypeNode('u32') }),
                structFieldTypeNode({ name: 'firstname', type: fixedSizeTypeNode(stringTypeNode('utf8'), 42) }),
            ]),
            4 + 42,
        );
    });
    test('it returns null if any field is variable', () => {
        expectSize(
            structTypeNode([
                structFieldTypeNode({ name: 'age', type: numberTypeNode('u32') }),
                structFieldTypeNode({ name: 'firstname', type: stringTypeNode('utf8') }),
            ]),
            null,
        );
    });
});

describe('tupleTypeNode', () => {
    test('it returns the sum of all sizes if all elements are fixed', () => {
        expectSize(tupleTypeNode([numberTypeNode('u16'), numberTypeNode('u32')]), 2 + 4);
    });
    test('it returns null if any item is variable', () => {
        expectSize(tupleTypeNode([numberTypeNode('u16'), stringTypeNode('utf8')]), null);
    });
});

describe('zeroableOptionTypeNode', () => {
    test('it returns the inner item size if it is fixed', () => {
        expectSize(zeroableOptionTypeNode(publicKeyTypeNode()), 32);
    });
    test('it returns null if the inner item is variable', () => {
        expectSize(zeroableOptionTypeNode(stringTypeNode('utf8')), null);
    });
    test('it returns the inner item size if it matches the zero value when provided', () => {
        const zeroValue = constantValueNodeFromString('base16', 'ffffffff');
        expectSize(zeroableOptionTypeNode(numberTypeNode('u32'), zeroValue), 4);
    });
    test('it returns null if the provided zero value does not match the inner item size', () => {
        const zeroValue = constantValueNodeFromString('base16', 'ffffffff');
        expectSize(zeroableOptionTypeNode(numberTypeNode('u64'), zeroValue), null);
    });
});
