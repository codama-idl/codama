import { CODAMA_ERROR__CANNOT_RESOLVE_PATH, CodamaError } from '@codama/errors';
import {
    arrayTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    fixedCountNode,
    instructionNode,
    integerTypeNode,
    optionTypeNode,
    pathString,
    programNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { formatDecodedNode, getDecodedNodeAtPath, getNodeCodec } from '../src';
import { hex } from './_setup';

const u8 = integerTypeNode('u8');
const config = structTypeNode([
    structFieldTypeNode({ identifier: 'fees', type: arrayTypeNode(u8, fixedCountNode(2)) }),
    structFieldTypeNode({ identifier: 'pair', type: tupleTypeNode([u8, u8]) }),
]);
const data = structTypeNode([
    structFieldTypeNode({ identifier: 'amount', type: u8 }),
    structFieldTypeNode({ identifier: 'config', type: config }),
]);
// amount = 42, fees = [25, 30], pair = [1, 2]
const bytes = hex('2a191e0102');

test('it returns struct fields as addressed', () => {
    const decoded = getNodeCodec([data]).decode(bytes);
    expect(getDecodedNodeAtPath(decoded, pathString('amount'))).toBe(decoded.fields[0]);
});

test('it follows nested struct fields and array indices', () => {
    const decoded = getNodeCodec([data]).decode(bytes);
    expect(getDecodedNodeAtPath(decoded, pathString('config.fees[1]'))?.value).toBe(30n);
});

test('it follows tuple indices', () => {
    const decoded = getNodeCodec([data]).decode(bytes);
    expect(getDecodedNodeAtPath(decoded, pathString('config.pair[0]'))?.value).toBe(1n);
});

test('it starts from the data of instructions', () => {
    const instruction = instructionNode({ data, identifier: 'configure' });
    const root = rootNode(programNode({ identifier: 'myProgram', instructions: [instruction], publicKey: '1111' }));
    const decoded = getNodeCodec([root, root.program, instruction]).decode(bytes);
    expect(getDecodedNodeAtPath(decoded, pathString('config.fees[0]'))?.value).toBe(25n);
});

test('it follows linked defined types', () => {
    const root = rootNode(
        programNode({
            definedTypes: [definedTypeNode({ identifier: 'config', type: config })],
            identifier: 'myProgram',
            publicKey: '1111',
        }),
    );
    const node = structTypeNode([structFieldTypeNode({ identifier: 'config', type: definedTypeLinkNode('config') })]);
    const decoded = getNodeCodec([root, root.program, node]).decode(hex('191e0102'));
    expect(getDecodedNodeAtPath(decoded, pathString('config.fees[1]'))?.value).toBe(30n);
});

test('it returns formatted nodes from formatted nodes', () => {
    const formatted = formatDecodedNode(getNodeCodec([data]).decode(bytes));
    expect(getDecodedNodeAtPath(formatted, pathString('config.fees[1]'))?.text).toBe('30');
});

test('it returns undefined for indices beyond the items of arrays', () => {
    const decoded = getNodeCodec([data]).decode(bytes);
    expect(getDecodedNodeAtPath(decoded, pathString('config.fees[2]'))).toBeUndefined();
});

test('it throws for unknown struct fields', () => {
    const decoded = getNodeCodec([data]).decode(bytes);
    expect(() => getDecodedNodeAtPath(decoded, pathString('config.owner'))).toThrow(
        new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
            nodePath: [data, data.fields![1], config],
            path: pathString('config.owner'),
            segment: 'owner',
        }),
    );
});

test('it throws for indices beyond the items of tuples', () => {
    const decoded = getNodeCodec([data]).decode(bytes);
    expect(() => getDecodedNodeAtPath(decoded, pathString('config.pair[2]'))).toThrow(
        expect.objectContaining({ context: expect.objectContaining({ segment: '[2]' }) }),
    );
});

test('it throws for segments applied to leaves', () => {
    const decoded = getNodeCodec([data]).decode(bytes);
    expect(() => getDecodedNodeAtPath(decoded, pathString('amount.value'))).toThrow(
        new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
            nodePath: [data, data.fields![0], u8],
            path: pathString('amount.value'),
            segment: 'value',
        }),
    );
});

test('it does not follow options', () => {
    const node = structTypeNode([structFieldTypeNode({ identifier: 'config', type: optionTypeNode(config) })]);
    const decoded = getNodeCodec([node]).decode(hex('01191e0102'));
    expect(() => getDecodedNodeAtPath(decoded, pathString('config.fees'))).toThrow(
        expect.objectContaining({ context: expect.objectContaining({ segment: 'fees' }) }),
    );
});

test('it does not follow enums', () => {
    const node = enumTypeNode([enumVariantTypeNode('set', { data: config })]);
    const decoded = getNodeCodec([node]).decode(hex('00191e0102'));
    expect(() => getDecodedNodeAtPath(decoded, pathString('fees'))).toThrow(
        expect.objectContaining({ context: expect.objectContaining({ segment: 'fees' }) }),
    );
});

test('it follows the data of enum variants', () => {
    const node = enumTypeNode([enumVariantTypeNode('set', { data: config })]);
    const decoded = getNodeCodec([node]).decode(hex('00191e0102'));
    expect(getDecodedNodeAtPath(decoded.variant, pathString('fees[0]'))?.value).toBe(25n);
});
