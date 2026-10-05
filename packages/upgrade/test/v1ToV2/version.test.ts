import { expect, test, vi } from 'vitest';

import type { v1 } from '../../src';
import { upgradeV1ToV2 } from '../../src';

// A latest version other than `2.0.0`, so the stamp cannot be a hard-coded first v2 version.
vi.mock('@codama/nodes', async importOriginal => ({
    ...(await importOriginal<typeof import('@codama/nodes')>()),
    CODAMA_VERSION: '2.7.1',
}));

test('it stamps upgraded IDLs with the latest v2 version', () => {
    const root = {
        kind: 'rootNode',
        program: { kind: 'programNode', name: 'myProgram', publicKey: '1111', version: '1.0.0' },
        standard: 'codama',
        version: '1.9.0',
    } as unknown as v1.RootNode;
    expect(upgradeV1ToV2(root).version).toBe('2.7.1');
});
