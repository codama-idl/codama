import {
    accountNode,
    addTypeNodeTransforms,
    arrayTypeNode,
    booleanTypeNode,
    bytesTypeNode,
    bytesValueNode,
    constantValueNode,
    constantValueNodeFromString,
    definedTypeLinkNode,
    definedTypeNode,
    durationTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    fixedCountNode,
    fixedPointTypeNode,
    fixedSizeTransformNode,
    floatTypeNode,
    GetNodeFromKind,
    hiddenPrefixTransformNode,
    hiddenSuffixTransformNode,
    integerTypeNode,
    integerValueNode,
    IntegerFormat,
    instructionNode,
    mapTypeNode,
    optionTypeNode,
    postOffsetTransformNode,
    preOffsetTransformNode,
    prefixedCountNode,
    programLinkNode,
    programNode,
    publicKeyTypeNode,
    remainderCountNode,
    remainderOptionTypeNode,
    rootNode,
    sentinelTransformNode,
    setTypeNode,
    sizePrefixTransformNode,
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
                    structFieldTypeNode({ identifier: 'mint', type: publicKeyTypeNode() }),
                    structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() }),
                    structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') }),
                ]),
                identifier: 'token',
            }),
            32 + 32 + 8,
        );
    });
});

describe('arrayTypeNode', () => {
    test('it returns a size if the count is fixed and the inner type is sized', () => {
        expectSize(arrayTypeNode(integerTypeNode('u16'), fixedCountNode(3)), 2 * 3);
    });
    test('it returns 0 if the count is 0 and the inner type is unsized', () => {
        expectSize(arrayTypeNode(stringTypeNode('utf8'), fixedCountNode(0)), 0);
    });
    test('it returns null if the count is not fixed', () => {
        expectSize(arrayTypeNode(integerTypeNode('u16'), prefixedCountNode(integerTypeNode('u8'))), null);
        expectSize(arrayTypeNode(integerTypeNode('u16'), remainderCountNode()), null);
    });
    test('it returns null if the inner type is unsized', () => {
        expectSize(arrayTypeNode(stringTypeNode('utf8'), fixedCountNode(3)), null);
        expectSize(arrayTypeNode(stringTypeNode('utf8'), prefixedCountNode(integerTypeNode('u8'))), null);
        expectSize(arrayTypeNode(stringTypeNode('utf8'), remainderCountNode()), null);
    });
    test('it returns 0 if the inner type size is 0 and the count is fixed', () => {
        expectSize(arrayTypeNode(tupleTypeNode([]), fixedCountNode(3)), 0);
    });
    test('it returns 0 if the inner type size is 0 and the count is remainder', () => {
        expectSize(arrayTypeNode(tupleTypeNode([]), remainderCountNode()), 0);
    });
    test('it returns the prefix size if the inner type size is 0 and the count is prefixed', () => {
        expectSize(arrayTypeNode(tupleTypeNode([]), prefixedCountNode(integerTypeNode('u32'))), 4);
        expectSize(arrayTypeNode(tupleTypeNode([]), prefixedCountNode(integerTypeNode('shortU16'))), null);
    });
});

describe('booleanTypeNode', () => {
    test('it returns 1 by default', () => {
        expectSize(booleanTypeNode(), 1);
    });
    test('it delegates to the custom boolean size otherwise', () => {
        expectSize(booleanTypeNode({ size: integerTypeNode('u64') }), 8);
        expectSize(booleanTypeNode({ size: integerTypeNode('shortU16') }), null);
    });
});

describe('bytesTypeNode', () => {
    test('it always returns null', () => {
        expectSize(bytesTypeNode(), null);
    });
});

describe('constantValueNode', () => {
    test('it returns the type size if fixed', () => {
        expectSize(constantValueNode(integerTypeNode('u32'), integerValueNode('42')), 4);
        expectSize(
            constantValueNode(
                addTypeNodeTransforms(stringTypeNode('utf8'), [fixedSizeTransformNode(42)]),
                stringValueNode('Hello'),
            ),
            42,
        );
    });
    test('it returns the size of byte value nodes when used with a base16 encoding', () => {
        expectSize(constantValueNode(bytesTypeNode(), bytesValueNode('base16', '11223344')), 4);
    });
    test('it returns the size of string value nodes when used with a base16 encoding', () => {
        expectSize(constantValueNode(stringTypeNode('base16'), stringValueNode('11223344')), 4);
    });
});

describe('durationTypeNode', () => {
    test('it delegates to the underlying number type', () => {
        expectSize(durationTypeNode(integerTypeNode('u64')), 8);
        expectSize(durationTypeNode(integerTypeNode('shortU16')), null);
    });
});

describe('fixedPointTypeNode', () => {
    test('it delegates to the underlying number type', () => {
        expectSize(fixedPointTypeNode(integerTypeNode('u64'), 9), 8);
        expectSize(fixedPointTypeNode(integerTypeNode('shortU16'), 9), null);
    });
});

describe('definedTypeNode', () => {
    test('it returns the size of the inner type', () => {
        expectSize(definedTypeNode({ identifier: 'fixed', type: integerTypeNode('u32') }), 4);
        expectSize(definedTypeNode({ identifier: 'variable', type: stringTypeNode('utf8') }), null);
    });
});

describe('definedTypeLinkNode', () => {
    test('it returns the size of the type being linked', () => {
        const context = programNode({
            definedTypes: [definedTypeNode({ identifier: 'myType', type: integerTypeNode('u64') })],
            identifier: 'myProgram',
            publicKey: '1111',
        });

        expectSizeWithContext([context, definedTypeLinkNode('myType')], 8);
    });
    test('it returns null if the linked type is variable', () => {
        const context = programNode({
            definedTypes: [definedTypeNode({ identifier: 'myType', type: stringTypeNode('utf8') })],
            identifier: 'myProgram',
            publicKey: '1111',
        });

        expectSizeWithContext([context, definedTypeLinkNode('myType')], null);
    });
    test('it returns null if the linked type cannot be found', () => {
        const context = programNode({ identifier: 'myProgram', publicKey: '1111' });
        expectSizeWithContext([context, definedTypeLinkNode('myMissingType')], null);
    });
    test('it returns null if the linked type is circular', () => {
        const context = programNode({
            definedTypes: [definedTypeNode({ identifier: 'myType', type: definedTypeLinkNode('myType') })],
            identifier: 'myProgram',
            publicKey: '1111',
        });

        expectSizeWithContext([context, definedTypeLinkNode('myType')], null);
    });
    test('it follows linked nodes using the correct paths when jumping between programs', () => {
        const typeA = definedTypeNode({
            identifier: 'typeA',
            type: definedTypeLinkNode('typeB1', { program: programLinkNode('programB') }),
        });
        const programA = programNode({
            definedTypes: [typeA],
            identifier: 'programA',
            publicKey: '1111',
        });
        const programB = programNode({
            definedTypes: [
                definedTypeNode({ identifier: 'typeB1', type: definedTypeLinkNode('typeB2') }),
                definedTypeNode({ identifier: 'typeB2', type: integerTypeNode('u64') }),
            ],
            identifier: 'programB',
            publicKey: '2222',
        });
        const context = rootNode(programA, { additionalPrograms: [programB] });

        expectSizeWithContext([context, programA, typeA], 8);
    });
});

describe('enumTypeNode', () => {
    test('it returns 1 by default for scalar enums', () => {
        expectSize(enumTypeNode([enumVariantTypeNode('A'), enumVariantTypeNode('B'), enumVariantTypeNode('C')]), 1);
    });
    test('it returns the custom size for scalar enums', () => {
        expectSize(
            enumTypeNode([enumVariantTypeNode('A'), enumVariantTypeNode('B'), enumVariantTypeNode('C')], {
                size: integerTypeNode('u64'),
            }),
            8,
        );
    });
    test('it returns a fixed size for data enums if all variants are the same fixed size', () => {
        expectSize(
            enumTypeNode(
                [
                    // 4 bytes
                    enumVariantTypeNode('A', { data: tupleTypeNode([integerTypeNode('u32')]) }),
                    // 4 bytes
                    enumVariantTypeNode('B', {
                        data: structTypeNode([
                            structFieldTypeNode({ identifier: 'x', type: integerTypeNode('u16') }),
                            structFieldTypeNode({ identifier: 'y', type: integerTypeNode('u16') }),
                        ]),
                    }),
                ],
                // 8 bytes prefix
                { size: integerTypeNode('u64') },
            ),
            8 + 4,
        );
    });
    test('it returns null if variants have different sizes', () => {
        expectSize(
            enumTypeNode([
                enumVariantTypeNode('A', { data: tupleTypeNode([integerTypeNode('u16')]) }), // 2 bytes
                enumVariantTypeNode('B', { data: tupleTypeNode([integerTypeNode('u32')]) }), // 4 bytes
            ]),
            null,
        );
    });
    test('it returns null if at least one variant is unsized', () => {
        expectSize(enumTypeNode([enumVariantTypeNode('A', { data: tupleTypeNode([stringTypeNode('utf8')]) })]), null);
    });
});

describe('fixedSizeTransformNode', () => {
    test('it returns the fixed size assigned by the transform', () => {
        expectSize(addTypeNodeTransforms(integerTypeNode('u8'), [fixedSizeTransformNode(32)]), 32);
        expectSize(addTypeNodeTransforms(stringTypeNode('utf8'), [fixedSizeTransformNode(32)]), 32);
    });
});

describe('hiddenPrefixTransformNode', () => {
    test('it returns the sum of all prefixes and the inner item if all of them are fixed', () => {
        const prefix1 = constantValueNodeFromString('base16', '2222');
        const prefix2 = constantValueNodeFromString('base16', '333333');
        expectSize(
            addTypeNodeTransforms(integerTypeNode('u32'), [hiddenPrefixTransformNode([prefix1, prefix2])]),
            2 + 3 + 4,
        );
    });
    test('it returns null if the inner item is variable', () => {
        const prefix = constantValueNodeFromString('base16', 'ffff');
        expectSize(addTypeNodeTransforms(stringTypeNode('utf8'), [hiddenPrefixTransformNode([prefix])]), null);
    });
});

describe('hiddenSuffixTransformNode', () => {
    test('it returns the sum of all suffixes and the inner item if all of them are fixed', () => {
        const suffix1 = constantValueNodeFromString('base16', '2222');
        const suffix2 = constantValueNodeFromString('base16', '333333');
        expectSize(
            addTypeNodeTransforms(integerTypeNode('u32'), [hiddenSuffixTransformNode([suffix1, suffix2])]),
            4 + 2 + 3,
        );
    });
    test('it returns null if the inner item is variable', () => {
        const suffix = constantValueNodeFromString('base16', 'ffff');
        expectSize(addTypeNodeTransforms(stringTypeNode('utf8'), [hiddenSuffixTransformNode([suffix])]), null);
    });
});

describe('instructionNode', () => {
    test('it returns the total size of all data fields in the instruction', () => {
        expectSize(
            instructionNode({
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'lamports', type: integerTypeNode('u64') }),
                    structFieldTypeNode({ identifier: 'space', type: integerTypeNode('u32') }),
                ]),
                identifier: 'createAccount',
            }),
            8 + 4,
        );
    });
    test('it returns null if any data field is unsized', () => {
        expectSize(
            instructionNode({
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'lamports', type: integerTypeNode('u64') }),
                    structFieldTypeNode({ identifier: 'name', type: stringTypeNode('utf8') }),
                ]),
                identifier: 'createAccount',
            }),
            null,
        );
    });
});

describe('mapTypeNode', () => {
    test('it returns a size if the count is fixed and the inner type is sized', () => {
        const key = integerTypeNode('u8'); // Fixed
        const value = integerTypeNode('u16'); // Fixed
        expectSize(mapTypeNode(key, value, fixedCountNode(3)), (1 + 2) * 3);
    });
    test('it returns 0 if the count is 0 and the inner type is unsized', () => {
        const key = stringTypeNode('utf8'); // Variable
        const value = integerTypeNode('u16'); // Fixed
        expectSize(mapTypeNode(key, value, fixedCountNode(0)), 0);
    });
    test('it returns null if the count is not fixed', () => {
        const key = integerTypeNode('u8'); // Fixed
        const value = integerTypeNode('u16'); // Fixed
        expectSize(mapTypeNode(key, value, prefixedCountNode(integerTypeNode('u8'))), null);
        expectSize(mapTypeNode(key, value, remainderCountNode()), null);
    });
    test('it returns null if the inner type is unsized', () => {
        const key = integerTypeNode('u8');
        const value = stringTypeNode('utf8');
        expectSize(mapTypeNode(key, value, fixedCountNode(3)), null);
        expectSize(mapTypeNode(key, value, prefixedCountNode(integerTypeNode('u8'))), null);
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
        expectSize(mapTypeNode(zeroSizeType, zeroSizeType, prefixedCountNode(integerTypeNode('u32'))), 4);
        expectSize(mapTypeNode(zeroSizeType, zeroSizeType, prefixedCountNode(integerTypeNode('shortU16'))), null);
    });
});

describe('integerTypeNode', () => {
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
    ] as const)('it returns the size of %s numbers', (format, expectedSize) => {
        expectSize(integerTypeNode(format as IntegerFormat), expectedSize);
    });
    test('it returns null if the format is shortU16', () => {
        expectSize(integerTypeNode('shortU16'), null);
    });
});

describe('floatTypeNode', () => {
    test('it returns the size of f32 numbers', () => {
        expectSize(floatTypeNode('f32'), 4);
    });
    test('it returns the size of f64 numbers', () => {
        expectSize(floatTypeNode('f64'), 8);
    });
});

describe('optionTypeNode', () => {
    test('it returns the sum of the prefix and the inner item sizes if both of them are fixed', () => {
        expectSize(optionTypeNode(integerTypeNode('u32'), { fixed: true }), 5);
        expectSize(optionTypeNode(integerTypeNode('u32'), { fixed: true, prefix: integerTypeNode('u16') }), 6);
    });
    test('it returns null if the inner item is not fixed', () => {
        expectSize(optionTypeNode(stringTypeNode('utf8'), { fixed: true }), null);
    });
    test('it returns null if the prefixed is not fixed', () => {
        expectSize(optionTypeNode(integerTypeNode('u32'), { fixed: true, prefix: integerTypeNode('shortU16') }), null);
    });
    test('it returns null if the option is not fixed', () => {
        expectSize(optionTypeNode(integerTypeNode('u32')), null);
        expectSize(optionTypeNode(integerTypeNode('u32'), { prefix: integerTypeNode('u16') }), null);
    });
});

describe('postOffsetTransformNode', () => {
    test('it increases the size by the offset when using a padded offset', () => {
        expectSize(
            addTypeNodeTransforms(integerTypeNode('u16'), [postOffsetTransformNode(10, { strategy: 'padded' })]),
            12,
        );
    });
    test('it returns null if the inner item is not fixed', () => {
        expectSize(
            addTypeNodeTransforms(stringTypeNode('utf8'), [postOffsetTransformNode(4, { strategy: 'padded' })]),
            null,
        );
    });
    test('it returns the size of the inner item for other offset strategies', () => {
        // Fixed.
        expectSize(addTypeNodeTransforms(integerTypeNode('u8'), [postOffsetTransformNode(42)]), 1);
        expectSize(
            addTypeNodeTransforms(integerTypeNode('u8'), [postOffsetTransformNode(42, { strategy: 'absolute' })]),
            1,
        );
        expectSize(
            addTypeNodeTransforms(integerTypeNode('u8'), [postOffsetTransformNode(42, { strategy: 'preOffset' })]),
            1,
        );
        expectSize(
            addTypeNodeTransforms(integerTypeNode('u8'), [postOffsetTransformNode(42, { strategy: 'relative' })]),
            1,
        );

        // Variable.
        expectSize(addTypeNodeTransforms(stringTypeNode('utf8'), [postOffsetTransformNode(42)]), null);
        expectSize(
            addTypeNodeTransforms(stringTypeNode('utf8'), [postOffsetTransformNode(42, { strategy: 'absolute' })]),
            null,
        );
        expectSize(
            addTypeNodeTransforms(stringTypeNode('utf8'), [postOffsetTransformNode(42, { strategy: 'preOffset' })]),
            null,
        );
        expectSize(
            addTypeNodeTransforms(stringTypeNode('utf8'), [postOffsetTransformNode(42, { strategy: 'relative' })]),
            null,
        );
    });
});

describe('preOffsetTransformNode', () => {
    test('it increases the size by the offset when using a padded offset', () => {
        expectSize(
            addTypeNodeTransforms(integerTypeNode('u16'), [preOffsetTransformNode(10, { strategy: 'padded' })]),
            12,
        );
    });
    test('it returns null if the inner item is not fixed', () => {
        expectSize(
            addTypeNodeTransforms(stringTypeNode('utf8'), [preOffsetTransformNode(4, { strategy: 'padded' })]),
            null,
        );
    });
    test('it returns the size of the inner item for other offset strategies', () => {
        // Fixed.
        expectSize(addTypeNodeTransforms(integerTypeNode('u8'), [preOffsetTransformNode(42)]), 1);
        expectSize(
            addTypeNodeTransforms(integerTypeNode('u8'), [preOffsetTransformNode(42, { strategy: 'absolute' })]),
            1,
        );
        expectSize(
            addTypeNodeTransforms(integerTypeNode('u8'), [preOffsetTransformNode(42, { strategy: 'relative' })]),
            1,
        );

        // Variable.
        expectSize(addTypeNodeTransforms(stringTypeNode('utf8'), [preOffsetTransformNode(42)]), null);
        expectSize(
            addTypeNodeTransforms(stringTypeNode('utf8'), [preOffsetTransformNode(42, { strategy: 'absolute' })]),
            null,
        );
        expectSize(
            addTypeNodeTransforms(stringTypeNode('utf8'), [preOffsetTransformNode(42, { strategy: 'relative' })]),
            null,
        );
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
        expectSize(remainderOptionTypeNode(integerTypeNode('u16')), null);
        expectSize(remainderOptionTypeNode(stringTypeNode('utf8')), null);
    });
});

describe('sentinelTransformNode', () => {
    test('it returns the inner type and the sentinel size if both of them are fixed', () => {
        const sentinel = constantValueNodeFromString('base16', 'ffff');
        expectSize(addTypeNodeTransforms(integerTypeNode('u32'), [sentinelTransformNode(sentinel)]), 6);
    });
    test('it returns null if the inner type is variable', () => {
        const sentinel = constantValueNodeFromString('base16', 'ffff');
        expectSize(addTypeNodeTransforms(stringTypeNode('utf8'), [sentinelTransformNode(sentinel)]), null);
    });
});

describe('setTypeNode', () => {
    test('it returns a size if the count is fixed and the inner type is sized', () => {
        expectSize(setTypeNode(integerTypeNode('u16'), fixedCountNode(3)), 2 * 3);
    });
    test('it returns 0 if the count is 0 and the inner type is unsized', () => {
        expectSize(setTypeNode(stringTypeNode('utf8'), fixedCountNode(0)), 0);
    });
    test('it returns null if the count is not fixed', () => {
        expectSize(setTypeNode(integerTypeNode('u16'), prefixedCountNode(integerTypeNode('u8'))), null);
        expectSize(setTypeNode(integerTypeNode('u16'), remainderCountNode()), null);
    });
    test('it returns null if the inner type is unsized', () => {
        expectSize(setTypeNode(stringTypeNode('utf8'), fixedCountNode(3)), null);
        expectSize(setTypeNode(stringTypeNode('utf8'), prefixedCountNode(integerTypeNode('u8'))), null);
        expectSize(setTypeNode(stringTypeNode('utf8'), remainderCountNode()), null);
    });
    test('it returns 0 if the inner type size is 0 and the count is fixed', () => {
        expectSize(setTypeNode(tupleTypeNode([]), fixedCountNode(3)), 0);
    });
    test('it returns 0 if the inner type size is 0 and the count is remainder', () => {
        expectSize(setTypeNode(tupleTypeNode([]), remainderCountNode()), 0);
    });
    test('it returns the prefix size if the inner type size is 0 and the count is prefixed', () => {
        expectSize(setTypeNode(tupleTypeNode([]), prefixedCountNode(integerTypeNode('u32'))), 4);
        expectSize(setTypeNode(tupleTypeNode([]), prefixedCountNode(integerTypeNode('shortU16'))), null);
    });
});

describe('sizePrefixTransformNode', () => {
    test('it returns the size of the size prefix if the inner type size is 0', () => {
        expectSize(addTypeNodeTransforms(tupleTypeNode([]), [sizePrefixTransformNode(integerTypeNode('u32'))]), 4);
    });
    test('it returns the sum of the prefix and the inner type if both are fixed', () => {
        expectSize(
            addTypeNodeTransforms(publicKeyTypeNode(), [sizePrefixTransformNode(integerTypeNode('u32'))]),
            4 + 32,
        );
    });
    test('it returns null if the inner type is variable', () => {
        expectSize(
            addTypeNodeTransforms(stringTypeNode('utf8'), [sizePrefixTransformNode(integerTypeNode('u32'))]),
            null,
        );
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
        expectSize(structFieldTypeNode({ identifier: 'fixed', type: integerTypeNode('u32') }), 4);
        expectSize(structFieldTypeNode({ identifier: 'variable', type: stringTypeNode('utf8') }), null);
    });
});

describe('structTypeNode', () => {
    test('it returns the sum of fields if all fields are fixed size', () => {
        expectSize(
            structTypeNode([
                structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u32') }),
                structFieldTypeNode({
                    identifier: 'firstname',
                    type: addTypeNodeTransforms(stringTypeNode('utf8'), [fixedSizeTransformNode(42)]),
                }),
            ]),
            4 + 42,
        );
    });
    test('it returns null if any field is variable', () => {
        expectSize(
            structTypeNode([
                structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u32') }),
                structFieldTypeNode({ identifier: 'firstname', type: stringTypeNode('utf8') }),
            ]),
            null,
        );
    });
});

describe('tupleTypeNode', () => {
    test('it returns the sum of all sizes if all elements are fixed', () => {
        expectSize(tupleTypeNode([integerTypeNode('u16'), integerTypeNode('u32')]), 2 + 4);
    });
    test('it returns null if any item is variable', () => {
        expectSize(tupleTypeNode([integerTypeNode('u16'), stringTypeNode('utf8')]), null);
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
        expectSize(zeroableOptionTypeNode(integerTypeNode('u32'), { zeroValue }), 4);
    });
    test('it returns null if the provided zero value does not match the inner item size', () => {
        const zeroValue = constantValueNodeFromString('base16', 'ffffffff');
        expectSize(zeroableOptionTypeNode(integerTypeNode('u64'), { zeroValue }), null);
    });
});
