import { publicKeyTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { GenericsV01, typeNodeFromAnchorV01 } from '../../../src';

const generics = {} as GenericsV01;

test('it creates public key type nodes', () => {
    expect(typeNodeFromAnchorV01('pubkey', generics)).toEqual(publicKeyTypeNode());
});
