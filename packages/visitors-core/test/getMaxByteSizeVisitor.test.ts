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
                    structFieldTypeNode({ identifier: 'authority', type: publicKeyTypeNode() }),
                    structFieldTypeNode({ identifier: 'maxSupply', type: optionTypeNode(integerTypeNode('u64')) }),
                ]),
                identifier: 'mint',
            }),
            32 + 9,
        );
    });
});

describe('arrayTypeNode', () => {
    test('it multiplies the max size of the inner item with the fixed count', () => {
        expectMaxSize(arrayTypeNode(optionTypeNode(integerTypeNode('u32')), fixedCountNode(3)), 5 * 3);
    });
    test('it returns 0 if the count is 0 and the inner type is unsized', () => {
        expectMaxSize(arrayTypeNode(stringTypeNode('utf8'), fixedCountNode(0)), 0);
    });
    test('it returns null if the count is not fixed', () => {
        expectMaxSize(arrayTypeNode(integerTypeNode('u16'), prefixedCountNode(integerTypeNode('u8'))), null);
        expectMaxSize(arrayTypeNode(integerTypeNode('u16'), remainderCountNode()), null);
    });
    test('it returns null if the inner type has no max size', () => {
        expectMaxSize(arrayTypeNode(stringTypeNode('utf8'), fixedCountNode(3)), null);
        expectMaxSize(arrayTypeNode(stringTypeNode('utf8'), prefixedCountNode(integerTypeNode('u8'))), null);
        expectMaxSize(arrayTypeNode(stringTypeNode('utf8'), remainderCountNode()), null);
    });
    test('it returns 0 if the inner type max size is 0 and the count is fixed', () => {
        expectMaxSize(arrayTypeNode(tupleTypeNode([]), fixedCountNode(3)), 0);
    });
    test('it returns 0 if the inner type max size is 0 and the count is remainder', () => {
        expectMaxSize(arrayTypeNode(tupleTypeNode([]), remainderCountNode()), 0);
    });
    test('it returns the prefix max size if the inner type size is 0 and the count is prefixed', () => {
        expectMaxSize(arrayTypeNode(tupleTypeNode([]), prefixedCountNode(integerTypeNode('u32'))), 4);
        expectMaxSize(arrayTypeNode(tupleTypeNode([]), prefixedCountNode(integerTypeNode('shortU16'))), 3);
    });
});

describe('booleanTypeNode', () => {
    test('it returns 1 by default', () => {
        expectMaxSize(booleanTypeNode(), 1);
    });
    test('it delegates to the custom boolean size otherwise', () => {
        expectMaxSize(booleanTypeNode({ size: integerTypeNode('u64') }), 8);
        expectMaxSize(booleanTypeNode({ size: integerTypeNode('shortU16') }), 3);
    });
});

describe('bytesTypeNode', () => {
    test('it always returns null', () => {
        expectMaxSize(bytesTypeNode(), null);
    });
});

describe('constantValueNode', () => {
    test('it returns the type size if it has a max size', () => {
        expectMaxSize(
            constantValueNode(optionTypeNode(integerTypeNode('u32')), someValueNode(integerValueNode('42'))),
            5,
        );
        expectMaxSize(
            constantValueNode(
                addTypeNodeTransforms(stringTypeNode('utf8'), [fixedSizeTransformNode(42)]),
                stringValueNode('Hello'),
            ),
            42,
        );
    });
    test('it returns the size of byte value nodes when used with a base16 encoding', () => {
        expectMaxSize(constantValueNode(bytesTypeNode(), bytesValueNode('base16', '11223344')), 4);
    });
    test('it returns the size of string value nodes when used with a base16 encoding', () => {
        expectMaxSize(constantValueNode(stringTypeNode('base16'), stringValueNode('11223344')), 4);
    });
});

describe('durationTypeNode', () => {
    test('it delegates to the underlying number type', () => {
        expectMaxSize(durationTypeNode(integerTypeNode('u64')), 8);
        expectMaxSize(durationTypeNode(integerTypeNode('shortU16')), 3);
    });
});

describe('fixedPointTypeNode', () => {
    test('it delegates to the underlying number type', () => {
        expectMaxSize(fixedPointTypeNode(integerTypeNode('u64'), 9), 8);
        expectMaxSize(fixedPointTypeNode(integerTypeNode('shortU16'), 9), 3);
    });
});

describe('definedTypeNode', () => {
    test('it returns the size of the inner type', () => {
        expectMaxSize(definedTypeNode({ identifier: 'withMaxSize', type: integerTypeNode('shortU16') }), 3);
        expectMaxSize(definedTypeNode({ identifier: 'withoutMaxSize', type: stringTypeNode('utf8') }), null);
    });
});

describe('definedTypeLinkNode', () => {
    test('it returns the max size of the type being linked', () => {
        const context = programNode({
            definedTypes: [definedTypeNode({ identifier: 'myType', type: integerTypeNode('shortU16') })],
            identifier: 'myProgram',
            publicKey: '1111',
        });

        expectMaxSizeWithContext([context, definedTypeLinkNode('myType')], 3);
    });
    test('it returns null if the linked type has no max size', () => {
        const context = programNode({
            definedTypes: [definedTypeNode({ identifier: 'myType', type: stringTypeNode('utf8') })],
            identifier: 'myProgram',
            publicKey: '1111',
        });

        expectMaxSizeWithContext([context, definedTypeLinkNode('myType')], null);
    });
    test('it returns null if the linked type cannot be found', () => {
        const context = programNode({ identifier: 'myProgram', publicKey: '1111' });
        expectMaxSizeWithContext([context, definedTypeLinkNode('myMissingType')], null);
    });
    test('it returns null if the linked type is circular', () => {
        const context = programNode({
            definedTypes: [definedTypeNode({ identifier: 'myType', type: definedTypeLinkNode('myType') })],
            identifier: 'myProgram',
            publicKey: '1111',
        });

        expectMaxSizeWithContext([context, definedTypeLinkNode('myType')], null);
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
                definedTypeNode({ identifier: 'typeB2', type: integerTypeNode('shortU16') }),
            ],
            identifier: 'programB',
            publicKey: '2222',
        });
        const context = rootNode(programA, { additionalPrograms: [programB] });

        expectMaxSizeWithContext([context, programA, typeA], 3);
    });
});

describe('enumTypeNode', () => {
    test('it returns 1 by default for scalar enums', () => {
        expectMaxSize(enumTypeNode([enumVariantTypeNode('A'), enumVariantTypeNode('B'), enumVariantTypeNode('C')]), 1);
    });
    test('it returns the custom size for scalar enums', () => {
        expectMaxSize(
            enumTypeNode([enumVariantTypeNode('A'), enumVariantTypeNode('B'), enumVariantTypeNode('C')], {
                size: integerTypeNode('shortU16'),
            }),
            3,
        );
    });
    test('it returns the size of the largest variant plus the prefix', () => {
        expectMaxSize(
            enumTypeNode(
                [
                    enumVariantTypeNode('A', { data: tupleTypeNode([integerTypeNode('u16')]) }), // 2 bytes
                    enumVariantTypeNode('B', { data: tupleTypeNode([integerTypeNode('u32')]) }), // 4 bytes
                ],
                { size: integerTypeNode('u64') },
            ),
            8 + 4,
        );
    });
    test('it returns null if at least one variant has no max size', () => {
        expectMaxSize(
            enumTypeNode([enumVariantTypeNode('A', { data: tupleTypeNode([stringTypeNode('utf8')]) })]),
            null,
        );
    });
});

describe('fixedSizeTransformNode', () => {
    test('it returns the fixed size assigned by the transform', () => {
        expectMaxSize(addTypeNodeTransforms(integerTypeNode('u8'), [fixedSizeTransformNode(32)]), 32);
        expectMaxSize(addTypeNodeTransforms(stringTypeNode('utf8'), [fixedSizeTransformNode(32)]), 32);
    });
});

describe('hiddenPrefixTransformNode', () => {
    test('it returns the sum of all prefixes and the inner item if all of them have a max size', () => {
        const prefix1 = constantValueNodeFromString('base16', '2222');
        const prefix2 = constantValueNodeFromString('base16', '333333');
        expectMaxSize(
            addTypeNodeTransforms(integerTypeNode('shortU16'), [hiddenPrefixTransformNode([prefix1, prefix2])]),
            2 + 3 + 3,
        );
    });
    test('it returns null if the inner item has no max size', () => {
        const prefix = constantValueNodeFromString('base16', 'ffff');
        expectMaxSize(addTypeNodeTransforms(stringTypeNode('utf8'), [hiddenPrefixTransformNode([prefix])]), null);
    });
});

describe('hiddenSuffixTransformNode', () => {
    test('it returns the sum of all suffixes and the inner item if all of them have a max size', () => {
        const suffix1 = constantValueNodeFromString('base16', '2222');
        const suffix2 = constantValueNodeFromString('base16', '333333');
        expectMaxSize(
            addTypeNodeTransforms(integerTypeNode('shortU16'), [hiddenSuffixTransformNode([suffix1, suffix2])]),
            3 + 2 + 3,
        );
    });
    test('it returns null if the inner item has no max size', () => {
        const suffix = constantValueNodeFromString('base16', 'ffff');
        expectMaxSize(addTypeNodeTransforms(stringTypeNode('utf8'), [hiddenSuffixTransformNode([suffix])]), null);
    });
});

describe('instructionNode', () => {
    test('it returns the total max size of all data fields in the instruction', () => {
        expectMaxSize(
            instructionNode({
                data: structTypeNode([
                    structFieldTypeNode({ identifier: 'lamports', type: optionTypeNode(integerTypeNode('u64')) }),
                    structFieldTypeNode({ identifier: 'space', type: integerTypeNode('shortU16') }),
                ]),
                identifier: 'createAccount',
            }),
            9 + 3,
        );
    });
    test('it returns null if any data field has no max size', () => {
        expectMaxSize(
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
    test('it multiplies the max size of the inner item with the fixed count', () => {
        const key = integerTypeNode('u8');
        const value = optionTypeNode(integerTypeNode('u16'));
        expectMaxSize(mapTypeNode(key, value, fixedCountNode(4)), (1 + 3) * 4);
    });
    test('it returns 0 if the count is 0 and the inner type is unsized', () => {
        const key = stringTypeNode('utf8');
        const value = integerTypeNode('u16');
        expectMaxSize(mapTypeNode(key, value, fixedCountNode(0)), 0);
    });
    test('it returns null if the count is not fixed', () => {
        const key = integerTypeNode('u8');
        const value = integerTypeNode('u16');
        expectMaxSize(mapTypeNode(key, value, prefixedCountNode(integerTypeNode('u8'))), null);
        expectMaxSize(mapTypeNode(key, value, remainderCountNode()), null);
    });
    test('it returns null if the inner type has no max size', () => {
        const key = integerTypeNode('u8');
        const value = stringTypeNode('utf8');
        expectMaxSize(mapTypeNode(key, value, fixedCountNode(3)), null);
        expectMaxSize(mapTypeNode(key, value, prefixedCountNode(integerTypeNode('u8'))), null);
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
        expectMaxSize(mapTypeNode(zeroSizeType, zeroSizeType, prefixedCountNode(integerTypeNode('u32'))), 4);
        expectMaxSize(mapTypeNode(zeroSizeType, zeroSizeType, prefixedCountNode(integerTypeNode('shortU16'))), 3);
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
        ['shortU16', 3],
    ] as const)('it returns the size of %s numbers', (format, expectedSize) => {
        expectMaxSize(integerTypeNode(format as IntegerFormat), expectedSize);
    });
});

describe('floatTypeNode', () => {
    test('it returns the size of f32 numbers', () => {
        expectMaxSize(floatTypeNode('f32'), 4);
    });
    test('it returns the size of f64 numbers', () => {
        expectMaxSize(floatTypeNode('f64'), 8);
    });
});

describe('optionTypeNode', () => {
    test('it returns the max size of the inner item plus 1 by default', () => {
        expectMaxSize(optionTypeNode(integerTypeNode('u32')), 1 + 4);
        expectMaxSize(optionTypeNode(integerTypeNode('u32'), { fixed: true }), 1 + 4);
    });
    test('it returns the sum of the prefix and inner item max sizes', () => {
        expectMaxSize(optionTypeNode(integerTypeNode('u32'), { prefix: integerTypeNode('u16') }), 2 + 4);
        expectMaxSize(optionTypeNode(integerTypeNode('u32'), { fixed: true, prefix: integerTypeNode('u16') }), 2 + 4);
    });
});

describe('postOffsetTransformNode', () => {
    test('it increases the max size by the offset when using a padded offset', () => {
        expectMaxSize(
            addTypeNodeTransforms(integerTypeNode('shortU16'), [postOffsetTransformNode(10, { strategy: 'padded' })]),
            13,
        );
    });
    test('it returns null if the inner item has no max size', () => {
        expectMaxSize(
            addTypeNodeTransforms(stringTypeNode('utf8'), [postOffsetTransformNode(4, { strategy: 'padded' })]),
            null,
        );
    });
    test('it returns the max size of the inner item for other offset strategies', () => {
        // Fixed.
        expectMaxSize(addTypeNodeTransforms(integerTypeNode('shortU16'), [postOffsetTransformNode(42)]), 3);
        expectMaxSize(
            addTypeNodeTransforms(integerTypeNode('shortU16'), [postOffsetTransformNode(42, { strategy: 'absolute' })]),
            3,
        );
        expectMaxSize(
            addTypeNodeTransforms(integerTypeNode('shortU16'), [
                postOffsetTransformNode(42, { strategy: 'preOffset' }),
            ]),
            3,
        );
        expectMaxSize(
            addTypeNodeTransforms(integerTypeNode('shortU16'), [postOffsetTransformNode(42, { strategy: 'relative' })]),
            3,
        );

        // Variable.
        expectMaxSize(addTypeNodeTransforms(stringTypeNode('utf8'), [postOffsetTransformNode(42)]), null);
        expectMaxSize(
            addTypeNodeTransforms(stringTypeNode('utf8'), [postOffsetTransformNode(42, { strategy: 'absolute' })]),
            null,
        );
        expectMaxSize(
            addTypeNodeTransforms(stringTypeNode('utf8'), [postOffsetTransformNode(42, { strategy: 'preOffset' })]),
            null,
        );
        expectMaxSize(
            addTypeNodeTransforms(stringTypeNode('utf8'), [postOffsetTransformNode(42, { strategy: 'relative' })]),
            null,
        );
    });
});

describe('preOffsetTransformNode', () => {
    test('it increases the max size by the offset when using a padded offset', () => {
        expectMaxSize(
            addTypeNodeTransforms(integerTypeNode('shortU16'), [preOffsetTransformNode(10, { strategy: 'padded' })]),
            13,
        );
    });
    test('it returns null if the inner item has no max size', () => {
        expectMaxSize(
            addTypeNodeTransforms(stringTypeNode('utf8'), [preOffsetTransformNode(4, { strategy: 'padded' })]),
            null,
        );
    });
    test('it returns the max size of the inner item for other offset strategies', () => {
        // Fixed.
        expectMaxSize(addTypeNodeTransforms(integerTypeNode('shortU16'), [preOffsetTransformNode(42)]), 3);
        expectMaxSize(
            addTypeNodeTransforms(integerTypeNode('shortU16'), [preOffsetTransformNode(42, { strategy: 'absolute' })]),
            3,
        );
        expectMaxSize(
            addTypeNodeTransforms(integerTypeNode('shortU16'), [preOffsetTransformNode(42, { strategy: 'relative' })]),
            3,
        );

        // Variable.
        expectMaxSize(addTypeNodeTransforms(stringTypeNode('utf8'), [preOffsetTransformNode(42)]), null);
        expectMaxSize(
            addTypeNodeTransforms(stringTypeNode('utf8'), [preOffsetTransformNode(42, { strategy: 'absolute' })]),
            null,
        );
        expectMaxSize(
            addTypeNodeTransforms(stringTypeNode('utf8'), [preOffsetTransformNode(42, { strategy: 'relative' })]),
            null,
        );
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
        expectMaxSize(remainderOptionTypeNode(integerTypeNode('u16')), null);
        expectMaxSize(remainderOptionTypeNode(stringTypeNode('utf8')), null);
    });
});

describe('sentinelTransformNode', () => {
    test('it returns the sum of the inner type and the sentinel max sizes if both of them exist', () => {
        const sentinel = constantValueNodeFromString('base16', 'ffff');
        expectMaxSize(addTypeNodeTransforms(integerTypeNode('shortU16'), [sentinelTransformNode(sentinel)]), 2 + 3);
    });
    test('it returns null if the inner type has no max size', () => {
        const sentinel = constantValueNodeFromString('base16', 'ffff');
        expectMaxSize(addTypeNodeTransforms(stringTypeNode('utf8'), [sentinelTransformNode(sentinel)]), null);
    });
});

describe('setTypeNode', () => {
    test('it multiplies the max size of the inner item with the fixed count', () => {
        expectMaxSize(setTypeNode(optionTypeNode(integerTypeNode('u32')), fixedCountNode(3)), 5 * 3);
    });
    test('it returns 0 if the count is 0 and the inner type is unsized', () => {
        expectMaxSize(setTypeNode(stringTypeNode('utf8'), fixedCountNode(0)), 0);
    });
    test('it returns null if the count is not fixed', () => {
        expectMaxSize(setTypeNode(integerTypeNode('u16'), prefixedCountNode(integerTypeNode('u8'))), null);
        expectMaxSize(setTypeNode(integerTypeNode('u16'), remainderCountNode()), null);
    });
    test('it returns null if the inner type has no max size', () => {
        expectMaxSize(setTypeNode(stringTypeNode('utf8'), fixedCountNode(3)), null);
        expectMaxSize(setTypeNode(stringTypeNode('utf8'), prefixedCountNode(integerTypeNode('u8'))), null);
        expectMaxSize(setTypeNode(stringTypeNode('utf8'), remainderCountNode()), null);
    });
    test('it returns 0 if the inner type max size is 0 and the count is fixed', () => {
        expectMaxSize(setTypeNode(tupleTypeNode([]), fixedCountNode(3)), 0);
    });
    test('it returns 0 if the inner type max size is 0 and the count is remainder', () => {
        expectMaxSize(setTypeNode(tupleTypeNode([]), remainderCountNode()), 0);
    });
    test('it returns the prefix max size if the inner type size is 0 and the count is prefixed', () => {
        expectMaxSize(setTypeNode(tupleTypeNode([]), prefixedCountNode(integerTypeNode('u32'))), 4);
        expectMaxSize(setTypeNode(tupleTypeNode([]), prefixedCountNode(integerTypeNode('shortU16'))), 3);
    });
});

describe('sizePrefixTransformNode', () => {
    test('it returns the max size of the prefix if the inner type size is 0', () => {
        expectMaxSize(
            addTypeNodeTransforms(tupleTypeNode([]), [sizePrefixTransformNode(integerTypeNode('shortU16'))]),
            3,
        );
    });
    test('it returns the sum of the prefix and the inner type max sizes if they both exist', () => {
        expectMaxSize(
            addTypeNodeTransforms(optionTypeNode(publicKeyTypeNode()), [
                sizePrefixTransformNode(integerTypeNode('shortU16')),
            ]),
            3 + 33,
        );
    });
    test('it returns null if the inner type has no max size', () => {
        expectMaxSize(
            addTypeNodeTransforms(stringTypeNode('utf8'), [sizePrefixTransformNode(integerTypeNode('u32'))]),
            null,
        );
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
        expectMaxSize(structFieldTypeNode({ identifier: 'withMaxSize', type: integerTypeNode('shortU16') }), 3);
        expectMaxSize(structFieldTypeNode({ identifier: 'withoutMaxSize', type: stringTypeNode('utf8') }), null);
    });
});

describe('structTypeNode', () => {
    test('it returns the sum of the field max sizes if they all have one', () => {
        expectMaxSize(
            structTypeNode([
                structFieldTypeNode({ identifier: 'age', type: integerTypeNode('shortU16') }),
                structFieldTypeNode({
                    identifier: 'firstname',
                    type: optionTypeNode(addTypeNodeTransforms(stringTypeNode('utf8'), [fixedSizeTransformNode(42)])),
                }),
            ]),
            3 + 43,
        );
    });
    test('it returns null if any field has no max size', () => {
        expectMaxSize(
            structTypeNode([
                structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u32') }),
                structFieldTypeNode({ identifier: 'firstname', type: stringTypeNode('utf8') }),
            ]),
            null,
        );
    });
});

describe('tupleTypeNode', () => {
    test('it returns the sum of all max sizes if all items have one', () => {
        expectMaxSize(tupleTypeNode([integerTypeNode('shortU16'), optionTypeNode(integerTypeNode('u32'))]), 3 + 5);
    });
    test('it returns null if any item has no max size', () => {
        expectMaxSize(tupleTypeNode([integerTypeNode('u16'), stringTypeNode('utf8')]), null);
    });
});

describe('zeroableOptionTypeNode', () => {
    test('it returns the inner item max size if is has one', () => {
        expectMaxSize(zeroableOptionTypeNode(integerTypeNode('shortU16')), 3);
    });
    test('it returns null if the inner item has no max size', () => {
        expectMaxSize(zeroableOptionTypeNode(stringTypeNode('utf8')), null);
    });
    test('it returns the maximum value between the inner item max size and the zero value when provided', () => {
        const zeroValue = (bytes: number) => constantValueNodeFromString('base16', 'ff'.repeat(bytes));
        expectMaxSize(zeroableOptionTypeNode(integerTypeNode('u32'), { zeroValue: zeroValue(2) }), 4);
        expectMaxSize(zeroableOptionTypeNode(integerTypeNode('u32'), { zeroValue: zeroValue(42) }), 42);
    });
});
