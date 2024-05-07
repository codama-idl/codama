import { publicKeyTypeNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV01 } from '../../../src';

test('it creates public key type nodes', () => {
    expect(typeNodeFromAnchorV01('pubkey')).toEqual(publicKeyTypeNode());
});
