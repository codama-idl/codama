import { booleanTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV01 } from '../../../src/index.js';

test('it creates boolean type nodes', t => {
    t.deepEqual(typeNodeFromAnchorV01('bool'), booleanTypeNode());
});
