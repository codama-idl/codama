import { publicKeyTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV01 } from '../../../src/v01/typeNodes/TypeNode';
import { GenericsV01 } from '../../../src/v01/unwrapGenerics';

const generics = {} as GenericsV01;

test('it creates public key type nodes', () => {
    expect(typeNodeFromAnchorV01('pubkey', generics)).toEqual(publicKeyTypeNode());
});
