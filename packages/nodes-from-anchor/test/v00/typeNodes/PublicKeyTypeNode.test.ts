import { publicKeyTypeNode } from '@codama/nodes';
import { expect, test } from 'vitest';

import { typeNodeFromAnchorV00 } from '../../../src/v00/typeNodes/TypeNode';

test('it creates public key type nodes', () => {
    expect(typeNodeFromAnchorV00('publicKey')).toEqual(publicKeyTypeNode());
});
