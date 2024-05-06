import { publicKeyTypeNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src';

test('it creates public key type nodes', () => {
    expect(typeNodeFromAnchorV00('publicKey')).toEqual(publicKeyTypeNode());
});
