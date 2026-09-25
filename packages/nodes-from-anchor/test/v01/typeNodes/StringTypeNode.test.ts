import { integerTypeNode, sizePrefixTransformNode, stringTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { GenericsV01, typeNodeFromAnchorV01 } from '../../../src';

const generics = {} as GenericsV01;

test('it creates string type nodes', () => {
    expect(typeNodeFromAnchorV01('string', generics)).toEqual(
        stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] }),
    );
});
