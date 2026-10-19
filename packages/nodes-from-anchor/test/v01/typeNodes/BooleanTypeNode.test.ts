import { booleanTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV01 } from '../../../src/v01/typeNodes/TypeNode';
import { GenericsV01 } from '../../../src/v01/unwrapGenerics';

const generics = {} as GenericsV01;

test('it creates boolean type nodes', () => {
    expect(typeNodeFromAnchorV01('bool', generics)).toEqual(booleanTypeNode());
});
