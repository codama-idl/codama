import { CODAMA_ERROR__LINKED_NODE_NOT_FOUND, CodamaError } from '@codama/errors';
import {
    arrayTypeNode,
    arrayValueNode,
    booleanTypeNode,
    booleanValueNode,
    bytesTypeNode,
    bytesValueNode,
    constantValueNode,
    dateTimeTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    durationTypeNode,
    enumTypeNode,
    enumValueNode,
    enumVariantTypeNode,
    fixedCountNode,
    fixedPointTypeNode,
    floatTypeNode,
    floatValueNode,
    injectedValueNode,
    integerTypeNode,
    integerValueNode,
    mapEntryValueNode,
    mapTypeNode,
    mapValueNode,
    noneValueNode,
    optionTypeNode,
    programNode,
    publicKeyTypeNode,
    publicKeyValueNode,
    remainderOptionTypeNode,
    rootNode,
    setTypeNode,
    setValueNode,
    someValueNode,
    stringTypeNode,
    stringValueNode,
    structFieldTypeNode,
    structFieldValueNode,
    structTypeNode,
    structValueNode,
    tupleTypeNode,
    tupleValueNode,
    zeroableOptionTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getLinkablesFromNode, isValueNodeOfType, LinkableDictionary } from '../src';

const linkables = new LinkableDictionary();
const u64 = integerTypeNode('u64');

test.each([
    ['booleans', booleanTypeNode(), booleanValueNode(true)],
    ['bytes', bytesTypeNode(), bytesValueNode('base16', '0102')],
    ['date-times', dateTimeTypeNode(integerTypeNode('i64')), integerValueNode('0')],
    ['durations', durationTypeNode(u64), integerValueNode('60')],
    ['fixed points', fixedPointTypeNode(u64, { scale: 2 }), integerValueNode('12345')],
    ['floats', floatTypeNode('f64'), floatValueNode('1.5')],
    ['floats from integers', floatTypeNode('f64'), integerValueNode('1')],
    ['integers', u64, integerValueNode('18446744073709551615')],
    ['public keys', publicKeyTypeNode(), publicKeyValueNode('11111111111111111111111111111111')],
    ['strings', stringTypeNode('utf8'), stringValueNode('hello')],
])('it accepts %s', (_, type, value) => {
    expect(isValueNodeOfType(value, [type], linkables)).toBe(true);
});

test.each([
    ['a string for an integer', u64, stringValueNode('All')],
    ['a float for an integer', u64, floatValueNode('1.5')],
    ['an integer for a boolean', booleanTypeNode(), integerValueNode('1')],
    ['an integer for a string', stringTypeNode('utf8'), integerValueNode('1')],
    ['a string for a public key', publicKeyTypeNode(), stringValueNode('11111111111111111111111111111111')],
])('it rejects %s', (_, type, value) => {
    expect(isValueNodeOfType(value, [type], linkables)).toBe(false);
});

test('it rejects injected values, which are not concrete', () => {
    expect(isValueNodeOfType(injectedValueNode({ key: 'max' }), [u64], linkables)).toBe(false);
});

test('it rejects constant values, which are not concrete', () => {
    expect(isValueNodeOfType(constantValueNode(u64, integerValueNode('1')), [u64], linkables)).toBe(false);
});

test.each([
    ['options', optionTypeNode(u64)],
    ['zeroable options', zeroableOptionTypeNode(u64)],
    ['remainder options', remainderOptionTypeNode(u64)],
])('it accepts none and some values of the item type for %s', (_, type) => {
    expect(isValueNodeOfType(noneValueNode(), [type], linkables)).toBe(true);
    expect(isValueNodeOfType(someValueNode(integerValueNode('1')), [type], linkables)).toBe(true);
    expect(isValueNodeOfType(someValueNode(stringValueNode('1')), [type], linkables)).toBe(false);
});

test('it rejects none values for types that are not options', () => {
    expect(isValueNodeOfType(noneValueNode(), [u64], linkables)).toBe(false);
});

test('it accepts arrays whose items are of the item type', () => {
    const type = arrayTypeNode(u64, fixedCountNode(2));
    expect(isValueNodeOfType(arrayValueNode([integerValueNode('1'), integerValueNode('2')]), [type], linkables)).toBe(
        true,
    );
    expect(isValueNodeOfType(arrayValueNode([stringValueNode('1')]), [type], linkables)).toBe(false);
    expect(isValueNodeOfType(setValueNode([integerValueNode('1')]), [type], linkables)).toBe(false);
});

test('it accepts sets whose items are of the item type', () => {
    const type = setTypeNode(u64, fixedCountNode(1));
    expect(isValueNodeOfType(setValueNode([integerValueNode('1')]), [type], linkables)).toBe(true);
    expect(isValueNodeOfType(arrayValueNode([integerValueNode('1')]), [type], linkables)).toBe(false);
});

test('it accepts tuples with one value of each item type', () => {
    const type = tupleTypeNode([u64, stringTypeNode('utf8')]);
    expect(isValueNodeOfType(tupleValueNode([integerValueNode('1'), stringValueNode('a')]), [type], linkables)).toBe(
        true,
    );
    expect(isValueNodeOfType(tupleValueNode([stringValueNode('a'), integerValueNode('1')]), [type], linkables)).toBe(
        false,
    );
    expect(isValueNodeOfType(tupleValueNode([integerValueNode('1')]), [type], linkables)).toBe(false);
});

test('it accepts maps whose keys and values are of their types', () => {
    const type = mapTypeNode(stringTypeNode('utf8'), u64, fixedCountNode(1));
    const valid = mapValueNode([mapEntryValueNode(stringValueNode('a'), integerValueNode('1'))]);
    const invalid = mapValueNode([mapEntryValueNode(integerValueNode('1'), integerValueNode('1'))]);
    expect(isValueNodeOfType(valid, [type], linkables)).toBe(true);
    expect(isValueNodeOfType(invalid, [type], linkables)).toBe(false);
});

test('it accepts structs whose fields are of their types', () => {
    const type = structTypeNode([structFieldTypeNode({ identifier: 'amount', type: u64 })]);
    const value = structValueNode([structFieldValueNode('amount', integerValueNode('1'))]);
    expect(isValueNodeOfType(value, [type], linkables)).toBe(true);
});

test('it rejects structs with fields of the wrong type', () => {
    const type = structTypeNode([structFieldTypeNode({ identifier: 'amount', type: u64 })]);
    const value = structValueNode([structFieldValueNode('amount', stringValueNode('1'))]);
    expect(isValueNodeOfType(value, [type], linkables)).toBe(false);
});

test('it rejects structs with unknown fields', () => {
    const type = structTypeNode([structFieldTypeNode({ identifier: 'amount', type: u64 })]);
    const value = structValueNode([
        structFieldValueNode('amount', integerValueNode('1')),
        structFieldValueNode('extra', integerValueNode('1')),
    ]);
    expect(isValueNodeOfType(value, [type], linkables)).toBe(false);
});

test('it rejects structs missing fields without a default value', () => {
    const type = structTypeNode([
        structFieldTypeNode({ identifier: 'amount', type: u64 }),
        structFieldTypeNode({ identifier: 'fee', type: u64 }),
    ]);
    const value = structValueNode([structFieldValueNode('amount', integerValueNode('1'))]);
    expect(isValueNodeOfType(value, [type], linkables)).toBe(false);
});

test('it accepts structs missing fields with a default value', () => {
    const type = structTypeNode([
        structFieldTypeNode({ identifier: 'amount', type: u64 }),
        structFieldTypeNode({ defaultValue: integerValueNode('0'), identifier: 'fee', type: u64 }),
    ]);
    const value = structValueNode([structFieldValueNode('amount', integerValueNode('1'))]);
    expect(isValueNodeOfType(value, [type], linkables)).toBe(true);
});

test('it accepts enum values naming a variant and carrying its data', () => {
    const type = enumTypeNode([enumVariantTypeNode('market'), enumVariantTypeNode('limit', { data: u64 })]);
    const link = definedTypeLinkNode('order');
    expect(isValueNodeOfType(enumValueNode(link, 'market'), [type], linkables)).toBe(true);
    expect(isValueNodeOfType(enumValueNode(link, 'limit', { value: integerValueNode('5') }), [type], linkables)).toBe(
        true,
    );
});

test('it rejects enum values naming an unknown variant', () => {
    const type = enumTypeNode([enumVariantTypeNode('market')]);
    expect(isValueNodeOfType(enumValueNode(definedTypeLinkNode('order'), 'limit'), [type], linkables)).toBe(false);
});

test('it rejects enum values whose data does not fit their variant', () => {
    const type = enumTypeNode([enumVariantTypeNode('market'), enumVariantTypeNode('limit', { data: u64 })]);
    const link = definedTypeLinkNode('order');
    expect(isValueNodeOfType(enumValueNode(link, 'limit'), [type], linkables)).toBe(false);
    expect(isValueNodeOfType(enumValueNode(link, 'limit', { value: stringValueNode('5') }), [type], linkables)).toBe(
        false,
    );
    expect(isValueNodeOfType(enumValueNode(link, 'market', { value: integerValueNode('5') }), [type], linkables)).toBe(
        false,
    );
});

test('it follows links to defined types', () => {
    const amount = definedTypeNode({ identifier: 'amount', type: optionTypeNode(u64) });
    const program = programNode({ definedTypes: [amount], identifier: 'myProgram', publicKey: '1111' });
    const root = rootNode(program);
    const programLinkables = getLinkablesFromNode(root);

    const typePath = [root, program, definedTypeLinkNode('amount')] as const;
    expect(isValueNodeOfType(noneValueNode(), typePath, programLinkables)).toBe(true);
    expect(isValueNodeOfType(integerValueNode('1'), typePath, programLinkables)).toBe(false);
});

test('it rejects values of alias cycles, which have no value', () => {
    const typeA = definedTypeNode({ identifier: 'a', type: definedTypeLinkNode('b') });
    const typeB = definedTypeNode({ identifier: 'b', type: definedTypeLinkNode('a') });
    const program = programNode({ definedTypes: [typeA, typeB], identifier: 'myProgram', publicKey: '1111' });
    const root = rootNode(program);
    const programLinkables = getLinkablesFromNode(root);

    expect(isValueNodeOfType(integerValueNode('1'), [root, program, definedTypeLinkNode('a')], programLinkables)).toBe(
        false,
    );
});

test('it throws when a link cannot be resolved', () => {
    const program = programNode({ identifier: 'myProgram', publicKey: '1111' });
    const root = rootNode(program);
    const link = definedTypeLinkNode('missing');
    expect(() => isValueNodeOfType(integerValueNode('1'), [root, program, link], linkables)).toThrow(
        new CodamaError(CODAMA_ERROR__LINKED_NODE_NOT_FOUND, {
            path: [root, program, link],
        }),
    );
});
