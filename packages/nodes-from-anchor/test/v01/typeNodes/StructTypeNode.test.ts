import { KINOBI_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE, KinobiError } from '@kinobi-so/errors';
import {
    arrayTypeNode,
    numberTypeNode,
    prefixedCountNode,
    publicKeyTypeNode,
    sizePrefixTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV01 } from '../../../src';

test('it creates struct type nodes', () => {
    const node = typeNodeFromAnchorV01({
        fields: [
            { name: 'name', type: 'string' },
            { name: 'age', type: 'u8' },
            { name: 'created_at', type: 'u8' },
        ],
        kind: 'struct',
    });

    expect(node).toEqual(
        structTypeNode([
            structFieldTypeNode({
                name: 'name',
                type: sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32')),
            }),
            structFieldTypeNode({ name: 'age', type: numberTypeNode('u8') }),
            structFieldTypeNode({ name: 'createdAt', type: numberTypeNode('u8') }),
        ]),
    );
});

test('it creates tuple type nodes when unnamed fields are provided', () => {
    const node = typeNodeFromAnchorV01({
        fields: ['u8', { vec: 'pubkey' }],
        kind: 'struct',
    });

    expect(node).toEqual(
        tupleTypeNode([
            numberTypeNode('u8'),
            arrayTypeNode(publicKeyTypeNode(), prefixedCountNode(numberTypeNode('u32'))),
        ]),
    );
});

test('it fails when a mixture of named and unnamed fields are provided', () => {
    const anchorIdl = {
        fields: [{ name: 'name', type: 'string' }, 'u8'],
        kind: 'struct',
    } as const;

    // @ts-expect-error Invalid IDL type because of mixed named and unnamed fields.
    expect(() => typeNodeFromAnchorV01(anchorIdl)).toThrow(
        new KinobiError(KINOBI_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE, {
            idlType: JSON.stringify(anchorIdl),
        }),
    );
});
