import { CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING, CodamaError } from '@codama/errors';
import {
    accountValueNode,
    bytesTypeNode,
    constantPdaSeedNodeFromBytes,
    dataValueNode,
    definedTypeLinkNode,
    integerTypeNode,
    pdaSeedValueNode,
    publicKeyTypeNode,
    sizePrefixTransformNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { pdaSeedNodeFromAnchorV01 } from '../../src';

test('it creates a PdaSeedNode from a const Anchor seed', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'const', value: [11, 57, 246, 240] }, []);

    expect(nodes?.definition).toEqual(constantPdaSeedNodeFromBytes('base58', 'HeLLo'));
    expect(nodes?.value).toBeUndefined();
});

test('it creates a PdaSeedNode from an account Anchor seed', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'account', path: 'authority' }, []);

    expect(nodes?.definition).toEqual(variablePdaSeedNode('authority', publicKeyTypeNode()));
    expect(nodes?.value).toEqual(pdaSeedValueNode('authority', accountValueNode('authority')));
});

test('it prefixes account Anchor seeds', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'account', path: 'authority' }, [], { prefix: 'group' });

    expect(nodes?.definition).toEqual(variablePdaSeedNode('group_authority', publicKeyTypeNode()));
    expect(nodes?.value).toEqual(pdaSeedValueNode('group_authority', accountValueNode('group_authority')));
});

test('it creates a PdaSeedNode from an arg Anchor seed', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'capacity' }, [
        structFieldTypeNode({ identifier: 'capacity', type: integerTypeNode('u64') }),
    ]);

    expect(nodes?.definition).toEqual(variablePdaSeedNode('capacity', integerTypeNode('u64')));
    expect(nodes?.value).toEqual(pdaSeedValueNode('capacity', dataValueNode('capacity')));
});

test('it removes the string prefix from arg Anchor seeds', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'identifier' }, [
        structFieldTypeNode({
            identifier: 'identifier',
            type: stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] }),
        }),
    ]);

    expect(nodes?.definition).toEqual(variablePdaSeedNode('identifier', stringTypeNode('utf8')));
    expect(nodes?.value).toEqual(pdaSeedValueNode('identifier', dataValueNode('identifier')));
});

test('it removes the bytes prefix from arg Anchor seeds', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'seed_data' }, [
        structFieldTypeNode({
            identifier: 'seed_data',
            type: bytesTypeNode({ transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] }),
        }),
    ]);

    expect(nodes?.definition).toEqual(variablePdaSeedNode('seed_data', bytesTypeNode()));
    expect(nodes?.value).toEqual(pdaSeedValueNode('seed_data', dataValueNode('seed_data')));
});

test('it fails when an arg Anchor seed does not match any data field', () => {
    expect(() =>
        pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'missing' }, [
            structFieldTypeNode({ identifier: 'capacity', type: integerTypeNode('u64') }),
        ]),
    ).toThrow(new CodamaError(CODAMA_ERROR__ANCHOR__ARGUMENT_TYPE_MISSING, { name: 'missing' }));
});

test('it creates a PdaSeedNode from a nested arg Anchor seed', () => {
    // Given an argument whose type links to a struct defined by the program.
    const dataFields = [structFieldTypeNode({ identifier: 'params', type: definedTypeLinkNode('Params') })];
    const definedTypes = new Map([
        [
            'Params',
            structTypeNode([
                structFieldTypeNode({
                    identifier: 'seed',
                    type: stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] }),
                }),
            ]),
        ],
    ]);

    // When we convert a seed pointing to a nested field of that argument.
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'params.seed' }, dataFields, { definedTypes });

    // Then the seed points to that nested path, with the type of the nested field.
    expect(nodes).toEqual({
        definition: variablePdaSeedNode('params_seed', stringTypeNode('utf8')),
        value: pdaSeedValueNode('params_seed', dataValueNode('params.seed')),
    });
});

test('it cannot express nested account seeds or nested arg seeds outside structs', () => {
    // Given an argument that is not a struct.
    const dataFields = [structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })];

    // When we convert seeds requiring an account fetch or a path through a non-struct type,
    // then we expect them to be unsupported.
    expect(
        pdaSeedNodeFromAnchorV01({ account: 'Mint', kind: 'account', path: 'mint.authority' }, dataFields),
    ).toBeUndefined();
    expect(pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'amount.inner' }, dataFields)).toBeUndefined();
});
