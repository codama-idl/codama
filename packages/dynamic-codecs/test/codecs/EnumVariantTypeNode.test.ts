import {
    CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION,
    CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE,
    CodamaError,
} from '@codama/errors';
import {
    definedTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    integerTypeNode,
    programNode,
    rootNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../src';
import { hex } from '../_setup';

test('it encodes standalone variants without their enum discriminator', () => {
    const codec = getNodeValueCodec([enumVariantTypeNode('move', { data: integerTypeNode('u8') })]);
    expect(codec.encode({ __kind: 'move', data: 7 })).toStrictEqual(hex('07'));
    expect(codec.decode(hex('07'))).toStrictEqual({ __kind: 'move', data: 7n });
});

test('it encodes standalone variants without data', () => {
    const codec = getNodeValueCodec([enumVariantTypeNode('quit')]);
    expect(codec.encode({ __kind: 'quit' })).toStrictEqual(hex(''));
    expect(codec.decode(hex(''))).toStrictEqual({ __kind: 'quit' });
});

test('it encodes variants with their enum discriminator when the path includes the enum', () => {
    // Given a variant whose path includes its enum.
    const move = enumVariantTypeNode('move', { data: integerTypeNode('u8') });
    const enumType = enumTypeNode([enumVariantTypeNode('quit'), enumVariantTypeNode('write'), move], {
        size: integerTypeNode('u16'),
    });
    const definedType = definedTypeNode({ identifier: 'action', type: enumType });
    const root = rootNode(programNode({ definedTypes: [definedType], identifier: 'myProgram', publicKey: '1111' }));

    // Then it encodes the same bytes as within its enum.
    const codec = getNodeValueCodec([root, root.program, definedType, enumType, move]);
    expect(codec.encode({ __kind: 'move', data: 7 })).toStrictEqual(hex('020007'));
    expect(codec.decode(hex('020007'))).toStrictEqual({ __discriminator: 2, __kind: 'move', data: 7n });
});

test('it uses custom discriminators when the path includes the enum', () => {
    const quit = enumVariantTypeNode('quit', { discriminator: 42 });
    const enumType = enumTypeNode([quit]);
    const codec = getNodeValueCodec([enumType, quit]);
    expect(codec.encode({ __kind: 'quit' })).toStrictEqual(hex('2a'));
    expect(codec.decode(hex('2a'))).toStrictEqual({ __discriminator: 42, __kind: 'quit' });
});

test('it finds its discriminator by identifier within its enum', () => {
    // Given a path whose variant is a copy of the variant within the enum.
    const move = enumVariantTypeNode('move', { data: integerTypeNode('u8') });
    const enumType = enumTypeNode([enumVariantTypeNode('quit'), enumVariantTypeNode('write'), move]);
    const codec = getNodeValueCodec([enumType, { ...move }]);

    // Then it still uses the discriminator of the variant within the enum.
    expect(codec.encode({ __kind: 'move', data: 7 })).toStrictEqual(hex('0207'));
});

test('it throws when the variant is not part of its parent enum', () => {
    const enumType = enumTypeNode([enumVariantTypeNode('quit')]);
    const move = enumVariantTypeNode('move');
    expect(() => getNodeValueCodec([enumType, move])).toThrow(
        new CodamaError(CODAMA_ERROR__DYNAMIC_CLIENT__INVARIANT_VIOLATION, {
            message: 'Enum variant [move] is not a variant of its parent enum.',
        }),
    );
});

test('it throws when a variant with data is encoded without data', () => {
    const move = enumVariantTypeNode('move', { data: integerTypeNode('u8') });
    const codec = getNodeValueCodec([move]);
    const context = {
        __code: CODAMA_ERROR__DYNAMIC_CLIENT__UNEXPECTED_VALUE_TYPE,
        actualType: "variant 'move' without data",
        expectedType: "{ __kind: 'move', data }",
        nodeKind: 'enumVariantTypeNode',
        nodePath: [move],
    };
    expect(() => codec.encode({ __kind: 'move', data: undefined })).toThrow(expect.objectContaining({ context }));
    // Unlike enums, standalone variants are not encoded from their identifier.
    expect(() => codec.encode('move')).toThrow(
        expect.objectContaining({ context: { ...context, actualType: 'string' } }),
    );
});
