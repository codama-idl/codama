import type { RootNode } from '@codama/nodes';
import { programNode, rootNode } from '@codama/nodes';
import { beforeEach, expect, test, vi } from 'vitest';

import { getConfig } from '../src/config';
import { getParsedConfig } from '../src/parsedConfig';
import { importModuleItem } from '../src/utils/import';
import { getRootNodeFromIdl } from '../src/utils/nodes';

vi.mock('../src/config', () => ({ getConfig: vi.fn() }));
vi.mock('../src/utils/import', () => ({ importModuleItem: vi.fn() }));
vi.mock('../src/utils/nodes', () => ({ getRootNodeFromIdl: vi.fn() }));

const getConfigMock = vi.mocked(getConfig);
const importModuleItemMock = vi.mocked(importModuleItem);
const getRootNodeFromIdlMock = vi.mocked(getRootNodeFromIdl);

function rootNodeWith(identifier: string): RootNode {
    return rootNode(programNode({ identifier, publicKey: '11111111111111111111111111111111' }));
}

beforeEach(() => {
    vi.resetAllMocks();
    importModuleItemMock.mockResolvedValue({});
});

test('merges additionalIdls programs into the root node additionalPrograms', async () => {
    getConfigMock.mockResolvedValue([{ additionalIdls: ['a.json', 'b.json'], idl: 'main.json' }, '/root/codama.json']);
    getRootNodeFromIdlMock
        .mockResolvedValueOnce({ ...rootNodeWith('main'), version: '9.9.9' } as unknown as RootNode)
        .mockResolvedValueOnce(rootNodeWith('a'))
        .mockResolvedValueOnce(rootNodeWith('b'));

    const parsed = await getParsedConfig({});

    expect(parsed.rootNode.program.identifier).toBe('main');
    expect((parsed.rootNode.additionalPrograms ?? []).map(p => p.identifier)).toEqual(['a', 'b']);
    // The main root node's other fields are preserved by the merge.
    expect(parsed.rootNode.standard).toBe('codama');
    expect(parsed.rootNode.version).toBe('9.9.9');
});

test('leaves the root node unchanged when no additionalIdls are provided', async () => {
    const mainRootNode = rootNodeWith('main');
    getConfigMock.mockResolvedValue([{ idl: 'main.json' }, '/root/codama.json']);
    getRootNodeFromIdlMock.mockResolvedValue(mainRootNode);

    const parsed = await getParsedConfig({});

    // The single root node is returned untouched, so its empty `additionalPrograms` stays omitted.
    expect(parsed.rootNode).toBe(mainRootNode);
    expect(parsed.rootNode.additionalPrograms).toBeUndefined();
});

test('parses a single before visitor provided as a string', async () => {
    getConfigMock.mockResolvedValue([{ before: './my-visitor.js', idl: 'main.json' }, '/root/codama.json']);
    getRootNodeFromIdlMock.mockResolvedValue(rootNodeWith('main'));

    const parsed = await getParsedConfig({});

    expect(parsed.before).toEqual([{ args: [], index: 0, item: undefined, path: '/root/my-visitor.js', script: null }]);
});

test('parses a single before visitor provided as an object', async () => {
    getConfigMock.mockResolvedValue([
        { before: { args: ['hello', 42], from: './my-visitor.js#myExport' }, idl: 'main.json' },
        '/root/codama.json',
    ]);
    getRootNodeFromIdlMock.mockResolvedValue(rootNodeWith('main'));

    const parsed = await getParsedConfig({});

    expect(parsed.before).toEqual([
        { args: ['hello', 42], index: 0, item: 'myExport', path: '/root/my-visitor.js', script: null },
    ]);
});
