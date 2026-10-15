import { CODAMA_ERROR__LINKED_NODE_NOT_FOUND } from '@codama/errors';
import {
    bytesTypeNode,
    bytesValueNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumValueNode,
    enumVariantTypeNode,
    injectedValueNode,
    instructionNode,
    integerTypeNode,
    integerValueNode,
    noneValueNode,
    optionTypeNode,
    prefixedCountNode,
    programNode,
    providedNode,
    rootNode,
    setTypeNode,
    setValueNode,
    structFieldDisplayNode,
    structFieldTypeNode,
    structFieldValueNode,
    structTypeNode,
    structValueNode,
    textNode,
    type TypeNode,
    type ValueLabelDisplayNode,
    valueLabelDisplayNode,
} from '@codama/nodes';
import { LinkableDictionary } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { assertIsDecodedNode, getNodeCodec, getValueLabel } from '../src';
import { hex } from './_setup';

const ALL = valueLabelDisplayNode({ label: 'All', value: integerValueNode('18446744073709551615') });

/** A standalone field of the given type and value labels. */
function field(type: TypeNode, valueLabels?: ValueLabelDisplayNode[]) {
    return structFieldTypeNode({
        display: valueLabels ? structFieldDisplayNode({ valueLabels }) : undefined,
        identifier: 'amount',
        type,
    });
}

test('it returns the label matching the decoded value', () => {
    const decoded = getNodeCodec([field(integerTypeNode('u64'), [ALL])]).decode(hex('ffffffffffffffff'));
    expect(getValueLabel(decoded)).toBe('All');
});

test('it returns undefined when no label matches', () => {
    const decoded = getNodeCodec([field(integerTypeNode('u64'), [ALL])]).decode(hex('2a00000000000000'));
    expect(getValueLabel(decoded)).toBeUndefined();
});

test('it returns undefined for fields without value labels', () => {
    const decoded = getNodeCodec([field(integerTypeNode('u64'))]).decode(hex('ffffffffffffffff'));
    expect(getValueLabel(decoded)).toBeUndefined();
});

test('it returns the first matching label', () => {
    const other = valueLabelDisplayNode({ label: 'Everything', value: integerValueNode('18446744073709551615') });
    const decoded = getNodeCodec([field(integerTypeNode('u64'), [ALL, other])]).decode(hex('ffffffffffffffff'));
    expect(getValueLabel(decoded)).toBe('All');
});

test('it returns the content of text node labels', () => {
    const label = valueLabelDisplayNode({
        label: textNode({ content: 'All' }),
        value: integerValueNode('18446744073709551615'),
    });
    const decoded = getNodeCodec([field(integerTypeNode('u64'), [label])]).decode(hex('ffffffffffffffff'));
    expect(getValueLabel(decoded)).toBe('All');
});

test('it matches values whatever their representation', () => {
    // Given bytes labelled in base16 and decoded in base64.
    const label = valueLabelDisplayNode({ label: 'Empty marker', value: bytesValueNode('base16', '0102') });
    const decoded = getNodeCodec([field(bytesTypeNode(), [label])]).decode(hex('0102'));
    expect(getValueLabel(decoded)).toBe('Empty marker');
});

test('it does not match values whose bytes only start with the label value', () => {
    const label = valueLabelDisplayNode({ label: 'Marker', value: bytesValueNode('base16', '01') });
    const decoded = getNodeCodec([field(bytesTypeNode(), [label])]).decode(hex('0102'));
    expect(getValueLabel(decoded)).toBeUndefined();
});

test('it matches absent options', () => {
    const label = valueLabelDisplayNode({ label: 'Never expires', value: noneValueNode() });
    const type = optionTypeNode(integerTypeNode('u64'), { prefix: integerTypeNode('u8') });
    expect(getValueLabel(getNodeCodec([field(type, [label])]).decode(hex('00')))).toBe('Never expires');
    expect(getValueLabel(getNodeCodec([field(type, [label])]).decode(hex('012a00000000000000')))).toBeUndefined();
});

test('it matches enum values through their links', () => {
    // Given a field linking to a program enum, labelled by variant.
    const status = definedTypeNode({
        identifier: 'status',
        type: enumTypeNode([enumVariantTypeNode('active'), enumVariantTypeNode('closed')]),
    });
    const label = valueLabelDisplayNode({ label: 'Done', value: enumValueNode('status', 'closed') });
    const data = structTypeNode([field(definedTypeLinkNode('status'), [label])]);
    const root = rootNode(programNode({ definedTypes: [status], identifier: 'myProgram', publicKey: '1111' }));

    // Then the label matches the decoded variant.
    const decoded = getNodeCodec([root, root.program, data]).decode(hex('01'));
    expect(getValueLabel(decoded.fields[0])).toBe('Done');
});

test('it resolves injected default values of label values from the enclosing instructions', () => {
    // Given a config whose fee defaults to a value provided by its instruction.
    const config = structTypeNode([
        structFieldTypeNode({ identifier: 'enabled', type: integerTypeNode('u8') }),
        structFieldTypeNode({
            defaultValue: injectedValueNode({ key: 'fee' }),
            identifier: 'fee',
            type: integerTypeNode('u8'),
        }),
    ]);
    // And a label whose value omits that fee.
    const label = valueLabelDisplayNode({
        label: 'Default config',
        value: structValueNode([structFieldValueNode('enabled', integerValueNode('1'))]),
    });
    const data = structTypeNode([field(config, [label])]);
    const instruction = instructionNode({
        data,
        identifier: 'configure',
        provides: [providedNode('fee', integerValueNode('5'))],
    });
    const root = rootNode(programNode({ identifier: 'myProgram', instructions: [instruction], publicKey: '1111' }));

    // Then the label value uses the provided fee, and matches.
    const decoded = getNodeCodec([root, root.program, instruction]).decode(hex('0105'));
    assertIsDecodedNode(decoded.data, 'structTypeNode');
    expect(getValueLabel(decoded.data.fields[0])).toBe('Default config');
});

test('it returns undefined for decoded sets holding duplicates', () => {
    // Given a set decoded with duplicate items, which sets cannot encode.
    const label = valueLabelDisplayNode({ label: 'One', value: setValueNode([integerValueNode('1')]) });
    const type = setTypeNode(integerTypeNode('u8'), prefixedCountNode(integerTypeNode('u8')));
    const decoded = getNodeCodec([field(type, [label])]).decode(hex('020101'));
    expect(getValueLabel(decoded)).toBeUndefined();
});

test('it uses the given linkables rather than recording them', () => {
    // Given a field linking to a program enum, and linkables that do not record it.
    const status = definedTypeNode({
        identifier: 'status',
        type: enumTypeNode([enumVariantTypeNode('active'), enumVariantTypeNode('closed')]),
    });
    const label = valueLabelDisplayNode({ label: 'Done', value: enumValueNode('status', 'closed') });
    const data = structTypeNode([field(definedTypeLinkNode('status'), [label])]);
    const root = rootNode(programNode({ definedTypes: [status], identifier: 'myProgram', publicKey: '1111' }));
    const decoded = getNodeCodec([root, root.program, data]).decode(hex('01'));

    // Then the link cannot be resolved from them.
    expect(() => getValueLabel(decoded.fields[0], { linkables: new LinkableDictionary() })).toThrow(
        expect.objectContaining({ context: expect.objectContaining({ __code: CODAMA_ERROR__LINKED_NODE_NOT_FOUND }) }),
    );
});
