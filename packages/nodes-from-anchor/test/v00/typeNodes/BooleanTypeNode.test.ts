import { booleanTypeNode } from '@kinobi-so/nodes';
import test from 'ava';

import { typeNodeFromAnchorV00 } from '../../../src/index.js';

test('it creates boolean type nodes', t => {
    t.deepEqual(typeNodeFromAnchorV00('bool'), booleanTypeNode());
});
