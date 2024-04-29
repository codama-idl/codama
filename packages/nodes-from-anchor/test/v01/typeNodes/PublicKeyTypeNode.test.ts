import { publicKeyTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV01 } from '../../../src/index.js';

test('it creates public key type nodes', t => {
    t.deepEqual(typeNodeFromAnchorV01('pubkey'), publicKeyTypeNode());
});
