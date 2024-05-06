import { booleanTypeNode } from '@kinobi-so/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV01 } from '../../../src/index.js';

test('it creates boolean type nodes', () => {
    expect(typeNodeFromAnchorV01('bool')).toEqual(booleanTypeNode());
});
