import { CODAMA_ERROR__UNEXPECTED_NODE_KIND, CodamaError } from '@codama/errors';
import {
    type AccountLinkNode,
    type DefinedTypeLinkNode,
    integerTypeNode,
    type IntegerTypeNode,
    structFieldTypeNode,
    structTypeNode,
    type StructTypeNode,
} from '@codama/nodes';
import { describe, expect, expectTypeOf, test } from 'vitest';

import {
    assertIsDecodedNode,
    type DecodedAccountNode,
    type DecodedIntegerTypeNode,
    type DecodedNode,
    type DecodedStructFieldTypeNode,
    type DecodedStructTypeNode,
    type DecodedTypeNode,
    type GetDecodedNode,
    type GetDecodedNodeFromKind,
    getNodeCodec,
    isDecodedNode,
} from '../src';
import { hex } from './_setup';

describe('isDecodedNode', () => {
    test('it tells whether a decoded node was decoded by a node of the given kind', () => {
        // Given a decoded struct field whose type is an integer.
        const struct = structTypeNode([structFieldTypeNode({ identifier: 'a', type: integerTypeNode('u8') })]);
        const type = getNodeCodec([struct]).decode(hex('2a')).fields[0].type;

        // When we check its kind, then only the integer kind matches.
        expect(isDecodedNode(type, 'integerTypeNode')).toBe(true);
        expect(isDecodedNode(type, ['booleanTypeNode', 'integerTypeNode'])).toBe(true);
        expect(isDecodedNode(type, 'structTypeNode')).toBe(false);
    });

    test('it rejects missing decoded nodes', () => {
        expect(isDecodedNode(undefined, 'integerTypeNode')).toBe(false);
        expect(isDecodedNode(null, 'integerTypeNode')).toBe(false);
    });

    test('it narrows decoded nodes to the given kind', () => {
        const type = {} as DecodedTypeNode;
        if (isDecodedNode(type, 'integerTypeNode')) {
            expectTypeOf(type).toEqualTypeOf<DecodedIntegerTypeNode>();
            expectTypeOf(type.value).toEqualTypeOf<bigint>();
        }
        if (isDecodedNode(type, 'structTypeNode')) {
            expectTypeOf(type.fields).toEqualTypeOf<readonly DecodedStructFieldTypeNode[]>();
        }
    });
});

describe('assertIsDecodedNode', () => {
    test('it accepts decoded nodes of the given kind', () => {
        const node = integerTypeNode('u8');
        const decoded = getNodeCodec([node]).decode(hex('2a'));
        expect(() => assertIsDecodedNode(decoded, 'integerTypeNode')).not.toThrow();
    });

    test('it throws for decoded nodes of another kind', () => {
        const node = integerTypeNode('u8');
        const decoded = getNodeCodec([node]).decode(hex('2a'));
        expect(() => assertIsDecodedNode(decoded, 'structTypeNode')).toThrow(
            new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                expectedKinds: ['structTypeNode'],
                kind: 'integerTypeNode',
                node,
            }),
        );
    });
});

describe('decoded node types', () => {
    test('it types the decoded node of a codec after the last node of its path', () => {
        const codec = getNodeCodec([integerTypeNode('u8')]);
        expectTypeOf(codec.decode(hex('2a')).value).toEqualTypeOf<bigint>();
    });

    test('it types links as the decoded node they link to', () => {
        expectTypeOf<GetDecodedNode<AccountLinkNode>>().toEqualTypeOf<DecodedAccountNode>();
        expectTypeOf<GetDecodedNode<DefinedTypeLinkNode>>().toEqualTypeOf<DecodedTypeNode>();
    });

    test('it types decoded nodes of a node type as the decoded node of that type', () => {
        expectTypeOf<DecodedNode<StructTypeNode>>().toEqualTypeOf<DecodedStructTypeNode>();
        expectTypeOf<DecodedNode<IntegerTypeNode | StructTypeNode>>().toEqualTypeOf<
            DecodedIntegerTypeNode | DecodedStructTypeNode
        >();
        expectTypeOf<GetDecodedNodeFromKind<'structTypeNode'>>().toEqualTypeOf<DecodedStructTypeNode>();
    });

    test('it types the children of decoded nodes after the attributes of their node', () => {
        expectTypeOf<DecodedAccountNode['data']>().toEqualTypeOf<DecodedTypeNode>();
        expectTypeOf<DecodedStructFieldTypeNode['type']>().toEqualTypeOf<DecodedTypeNode>();
    });
});
