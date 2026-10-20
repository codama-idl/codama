import { bytesTypeNode, integerTypeNode, sizePrefixTransformNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV01 } from '../../../src/v01/typeNodes/TypeNode';
import { GenericsV01 } from '../../../src/v01/unwrapGenerics';

const generics = {} as GenericsV01;

test('it creates bytes type nodes', () => {
    expect(typeNodeFromAnchorV01('bytes', generics)).toEqual(
        bytesTypeNode({ transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] }),
    );
});
