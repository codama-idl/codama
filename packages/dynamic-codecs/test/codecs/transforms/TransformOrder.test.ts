import {
    constantValueNodeFromBytes,
    fixedSizeTransformNode,
    hiddenPrefixTransformNode,
    integerTypeNode,
    sizePrefixTransformNode,
    stringTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { getNodeValueCodec } from '../../../src';
import { hex } from '../../_setup';

test('it applies transforms from the innermost to the outermost', () => {
    const fixedSize = fixedSizeTransformNode(4);
    const sizePrefix = sizePrefixTransformNode(integerTypeNode('u8'));

    // The size prefix wraps the fixed size, so it is always 4.
    const codecA = getNodeValueCodec([stringTypeNode('utf8', { transforms: [fixedSize, sizePrefix] })]);
    expect(codecA.encode('Hi')).toStrictEqual(hex('0448690000'));

    // The fixed size wraps the size prefix, so the prefix is part of the 4 bytes.
    const codecB = getNodeValueCodec([stringTypeNode('utf8', { transforms: [sizePrefix, fixedSize] })]);
    expect(codecB.encode('Hi')).toStrictEqual(hex('02486900'));
});

test('it applies several transforms of the same kind', () => {
    const codec = getNodeValueCodec([
        stringTypeNode('utf8', {
            transforms: [
                hiddenPrefixTransformNode([constantValueNodeFromBytes('base16', 'aa')]),
                hiddenPrefixTransformNode([constantValueNodeFromBytes('base16', 'bb')]),
            ],
        }),
    ]);
    expect(codec.encode('Hi')).toStrictEqual(hex('bbaa4869'));
    expect(codec.decode(hex('bbaa4869'))).toBe('Hi');
});
