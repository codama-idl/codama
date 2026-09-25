import { bytesTypeNode, integerTypeNode, sizePrefixTransformNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates bytes type nodes', () => {
    expect(typeNodeFromAnchorV00('bytes')).toEqual(
        bytesTypeNode({ transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] }),
    );
});
