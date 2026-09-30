import { integerTypeNode, sizePrefixTransformNode, stringTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates string type nodes', () => {
    expect(typeNodeFromAnchorV00('string')).toEqual(
        stringTypeNode('utf8', { transforms: [sizePrefixTransformNode(integerTypeNode('u32'))] }),
    );
});
