import { booleanTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { GenericsV01, typeNodeFromAnchorV01 } from '../../../src';

const generics = {} as GenericsV01;

test('it creates boolean type nodes', () => {
    expect(typeNodeFromAnchorV01('bool', generics)).toEqual(booleanTypeNode());
});
