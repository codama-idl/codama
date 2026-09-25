import { CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING, CodamaError } from '@codama/errors';
import {
    accountValueNode,
    bytesTypeNode,
    constantPdaSeedNodeFromBytes,
    dataValueNode,
    integerTypeNode,
    pdaSeedValueNode,
    publicKeyTypeNode,
    sizePrefixTransformNode,
    stringTypeNode,
    structFieldTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { pdaSeedNodeFromAnchorV01 } from '../../src';

test('it creates a PdaSeedNode from a const Anchor seed', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'const', value: [11, 57, 246, 240] }, []);

    expect(nodes.definition).toEqual(constantPdaSeedNodeFromBytes('base58', 'HeLLo'));
    expect(nodes.value).toBeUndefined();
});

test('it creates a PdaSeedNode from an account Anchor seed', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'account', path: 'authority' }, []);

    expect(nodes.definition).toEqual(variablePdaSeedNode('authority', publicKeyTypeNode()));
    expect(nodes.value).toEqual(pdaSeedValueNode('authority', accountValueNode('authority')));
});

test('it prefixes account Anchor seeds', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'account', path: 'authority' }, [], 'group');

    expect(nodes.definition).toEqual(variablePdaSeedNode('group_authority', publicKeyTypeNode()));
    expect(nodes.value).toEqual(pdaSeedValueNode('group_authority', accountValueNode('group_authority')));
});

test('it creates a PdaSeedNode from an arg Anchor seed', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'capacity' }, [
        structFieldTypeNode({ identifier: 'capacity', type: integerTypeNode('u64') }),
    ]);

    expect(nodes.definition).toEqual(variablePdaSeedNode('capacity', integerTypeNode('u64')));
    expect(nodes.value).toEqual(pdaSeedValueNode('capacity', dataValueNode('capacity')));
});

test('it removes the string prefix from arg Anchor seeds', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'identifier' }, [
        structFieldTypeNode({
            identifier: 'identifier',
            type: stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] }),
        }),
    ]);

    expect(nodes.definition).toEqual(variablePdaSeedNode('identifier', stringTypeNode('utf8')));
    expect(nodes.value).toEqual(pdaSeedValueNode('identifier', dataValueNode('identifier')));
});

test('it removes the bytes prefix from arg Anchor seeds', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'seed_data' }, [
        structFieldTypeNode({
            identifier: 'seed_data',
            type: bytesTypeNode({ transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] }),
        }),
    ]);

    expect(nodes.definition).toEqual(variablePdaSeedNode('seed_data', bytesTypeNode()));
    expect(nodes.value).toEqual(pdaSeedValueNode('seed_data', dataValueNode('seed_data')));
});

test('it fails when an arg Anchor seed does not match any data field', () => {
    expect(() =>
        pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'missing' }, [
            structFieldTypeNode({ identifier: 'capacity', type: integerTypeNode('u64') }),
        ]),
    ).toThrow(new CodamaError(CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING, { name: 'missing' }));
});
