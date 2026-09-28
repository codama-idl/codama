import {
    booleanTypeNode,
    booleanValueNode,
    bytesTypeNode,
    bytesValueNode,
    constantValueNode,
    fixedSizeTransformNode,
    integerTypeNode,
    integerValueNode,
    noneValueNode,
    optionTypeNode,
    someValueNode,
    stringTypeNode,
    stringValueNode,
    structFieldTypeNode,
    structFieldValueNode,
    structTypeNode,
    structValueNode,
} from '@codama/nodes';
import { LinkableDictionary, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { getNodeValueCodecVisitor, getValueNodeVisitor } from '../../src';

test('it returns bytes from encoded integers', () => {
    const node = constantValueNode(integerTypeNode('u32'), integerValueNode('42'));
    const result = visit(node, getValueNodeVisitor(new LinkableDictionary()));
    expect(result).toStrictEqual(['base64', 'KgAAAA==']);
});

test('it uses the default byte encoding from the codec visitor', () => {
    const node = constantValueNode(integerTypeNode('u32'), integerValueNode('42'));
    const linkables = new LinkableDictionary();
    const codecVisitorFactory = () => getNodeValueCodecVisitor(linkables, { bytesEncoding: 'base16' });
    const result = visit(node, getValueNodeVisitor(linkables, { codecVisitorFactory }));
    expect(result).toStrictEqual(['base16', '2a000000']);
});

test('it uses the default byte encoding from the codec visitor options', () => {
    const node = constantValueNode(integerTypeNode('u32'), integerValueNode('42'));
    const result = visit(
        node,
        getValueNodeVisitor(new LinkableDictionary(), { codecVisitorOptions: { bytesEncoding: 'base16' } }),
    );
    expect(result).toStrictEqual(['base16', '2a000000']);
});

test('it returns bytes from byte values', () => {
    const node = constantValueNode(bytesTypeNode(), bytesValueNode('base16', 'deadb0d1e5'));
    const result = visit(node, getValueNodeVisitor(new LinkableDictionary()));
    expect(result).toStrictEqual(['base64', '3q2w0eU=']);
});

test('it returns bytes from string values', () => {
    const node = constantValueNode(stringTypeNode('base16'), stringValueNode('deadb0d1e5'));
    const result = visit(node, getValueNodeVisitor(new LinkableDictionary()));
    expect(result).toStrictEqual(['base64', '3q2w0eU=']);
});

test('it returns bytes from boolean values', () => {
    const visitor = getValueNodeVisitor(new LinkableDictionary(), { codecVisitorOptions: { bytesEncoding: 'base16' } });
    const resultFalse = visit(constantValueNode(booleanTypeNode(), booleanValueNode(false)), visitor);
    const resultTrue = visit(constantValueNode(booleanTypeNode(), booleanValueNode(true)), visitor);
    expect(resultFalse).toStrictEqual(['base16', '00']);
    expect(resultTrue).toStrictEqual(['base16', '01']);
});

test('it returns bytes from struct values', () => {
    const node = constantValueNode(
        structTypeNode([
            structFieldTypeNode({
                identifier: 'firstname',
                type: stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(5)] }),
            }),
            structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u16') }),
        ]),
        structValueNode([
            structFieldValueNode('firstname', stringValueNode('John')),
            structFieldValueNode('age', integerValueNode('42')),
        ]),
    );
    const visitor = getValueNodeVisitor(new LinkableDictionary(), { codecVisitorOptions: { bytesEncoding: 'base16' } });
    const result = visit(node, visitor);
    expect(result).toStrictEqual(['base16', '4a6f686e002a00']);
});

test('it returns bytes from option values', () => {
    const visitor = getValueNodeVisitor(new LinkableDictionary(), { codecVisitorOptions: { bytesEncoding: 'base16' } });
    const type = optionTypeNode(integerTypeNode('u16'));
    const resultNone = visit(constantValueNode(type, noneValueNode()), visitor);
    const resultSome = visit(constantValueNode(type, someValueNode(integerValueNode('42'))), visitor);
    expect(resultNone).toStrictEqual(['base16', '00']);
    expect(resultSome).toStrictEqual(['base16', '012a00']);
});
