import { CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, CodamaError } from '@codama/errors';
import { fixedSizeTransformNode, integerTypeNode, stringTypeNode, tupleTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes tuples', () => {
    const codec = getNodeValueCodec([
        tupleTypeNode([stringTypeNode('utf8', { transforms: [fixedSizeTransformNode(3)] }), integerTypeNode('u16')]),
    ]);
    expect(codec.encode(['foo', 42])).toStrictEqual(hex('666f6f2a00'));
    expect(codec.decode(hex('666f6f2a00'))).toStrictEqual(['foo', 42n]);
});

test('it rejects tuples missing an item as a missing value of that item', () => {
    // Given a tuple of an integer and a string.
    const string = stringTypeNode('utf8');
    const tuple = tupleTypeNode([integerTypeNode('u8'), string]);
    const codec = getNodeValueCodec([tuple]);

    // When we encode a tuple without its string, then the string rejects its missing value.
    expect(() => codec.encode([42])).toThrow(
        new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE, {
            actualType: 'undefined',
            expectedType: 'string',
            nodeKind: 'stringTypeNode',
            nodePath: [tuple, string],
        }),
    );
});
