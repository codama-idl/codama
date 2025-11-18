import { bytesTypeNode, numberTypeNode, sizePrefixTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { GenericsV01, typeNodeFromAnchorV01 } from '../../../src';

const generics = {} as GenericsV01;

test('it creates bytes type nodes', () => {
    expect(typeNodeFromAnchorV01('bytes', generics)).toEqual(
        sizePrefixTypeNode(bytesTypeNode(), numberTypeNode('u32')),
    );
});
