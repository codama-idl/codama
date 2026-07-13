import type { ProgramNode, RootNode } from '@codama/nodes';
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

function programNode(name: string): ProgramNode {
    return {
        accounts: [],
        constants: [],
        definedTypes: [],
        errors: [],
        instructions: [],
        kind: 'programNode',
        name,
        pdas: [],
    } as unknown as ProgramNode;
}

function rootNodeWith(name: string): RootNode {
    return {
        additionalPrograms: [],
        kind: 'rootNode',
        program: programNode(name),
        standard: 'codama',
        version: '1.0.0',
    } as unknown as RootNode;
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

    expect(parsed.rootNode.program.name).toBe('main');
    expect(parsed.rootNode.additionalPrograms.map(p => p.name)).toEqual(['a', 'b']);
    // The main root node's other fields are preserved by the merge.
    expect(parsed.rootNode.standard).toBe('codama');
    expect(parsed.rootNode.version).toBe('9.9.9');
});

test('leaves the root node unchanged when no additionalIdls are provided', async () => {
    getConfigMock.mockResolvedValue([{ idl: 'main.json' }, '/root/codama.json']);
    getRootNodeFromIdlMock.mockResolvedValue(rootNodeWith('main'));

    const parsed = await getParsedConfig({});

    expect(parsed.rootNode.additionalPrograms).toEqual([]);
});
