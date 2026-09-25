import { CODAMA_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE, CodamaError } from '@codama/errors';
import {
    arrayTypeNode,
    integerTypeNode,
    prefixedCountNode,
    publicKeyTypeNode,
    sizePrefixTransformNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { GenericsV01, typeNodeFromAnchorV01 } from '../../../src';

const generics = {} as GenericsV01;

test('it creates struct type nodes', () => {
    const node = typeNodeFromAnchorV01(
        {
            fields: [
                { name: 'name', type: 'string' },
                { name: 'age', type: 'u8' },
                { name: 'created_at', type: 'u8' },
            ],
            kind: 'struct',
        },
        generics,
    );

    expect(node).toEqual(
        structTypeNode([
            structFieldTypeNode({
                identifier: 'name',
                type: stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] }),
            }),
            structFieldTypeNode({ identifier: 'age', type: integerTypeNode('u8') }),
            structFieldTypeNode({ identifier: 'created_at', type: integerTypeNode('u8') }),
        ]),
    );
});

test('it creates tuple type nodes when unnamed fields are provided', () => {
    const node = typeNodeFromAnchorV01(
        {
            fields: ['u8', { vec: 'pubkey' }],
            kind: 'struct',
        },
        generics,
    );

    expect(node).toEqual(
        tupleTypeNode([
            integerTypeNode('u8'),
            arrayTypeNode(publicKeyTypeNode(), prefixedCountNode(integerTypeNode('u32'))),
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
        new CodamaError(CODAMA_ERROR__ANCHOR__UNRECOGNIZED_IDL_TYPE, {
            idlType: JSON.stringify(anchorIdl),
        }),
    );
});
