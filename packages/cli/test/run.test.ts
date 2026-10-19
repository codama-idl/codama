import path from 'node:path';

import type { RootNode } from '@codama/nodes';
import { programNode, rootNode } from '@codama/nodes';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { createProgram } from '../src';
import { Config } from '../src/config';
import { importModuleItem } from '../src/utils/import';
import { installMissingDependencies } from '../src/utils/packageInstall';

vi.mock('../src/utils/import', () => ({ importModuleItem: vi.fn() }));
vi.mock('../src/utils/packageInstall', () => ({ installMissingDependencies: vi.fn() }));

const importModuleItemMock = vi.mocked(importModuleItem);
const installMissingDependenciesMock = vi.mocked(installMissingDependencies);

const root = path.resolve('/root');
const configPath = path.join(root, 'codama.json');

function rootNodeWith(identifier: string): RootNode {
    return rootNode(programNode({ identifier, publicKey: '11111111111111111111111111111111' }));
}

function mockModules(config: Config, visitors: Record<string, unknown>): void {
    const modules: Record<string, unknown> = {
        [path.join(root, 'idl.json')]: rootNodeWith('original'),
        [configPath]: config,
        ...Object.fromEntries(Object.entries(visitors).map(([name, visitor]) => [path.join(root, name), visitor])),
    };
    importModuleItemMock.mockImplementation(({ from }) => Promise.resolve(modules[from]));
}

const runScripts = (...scripts: string[]) =>
    createProgram({ exitOverride: true, suppressOutput: true }).parseAsync(
        ['--config', configPath, 'run', ...scripts],
        {
            from: 'user',
        },
    );

beforeEach(() => {
    vi.resetAllMocks();
    installMissingDependenciesMock.mockResolvedValue(true);
    vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
    vi.restoreAllMocks();
});

test('it passes the root node returned by a sync before visitor to the scripts', async () => {
    const script = vi.fn<(root: RootNode) => void>();
    mockModules(
        { before: ['./before.js'], idl: './idl.json', scripts: { apple: './apple.js' } },
        { 'apple.js': { visitRoot: script }, 'before.js': { visitRoot: () => rootNodeWith('updated') } },
    );

    await runScripts('apple');

    expect(script).toHaveBeenCalledExactlyOnceWith(rootNodeWith('updated'));
});

test('it passes the root node returned by an async before visitor to the scripts', async () => {
    const script = vi.fn<(root: RootNode) => void>();
    mockModules(
        { before: ['./before.js'], idl: './idl.json', scripts: { apple: './apple.js' } },
        {
            'apple.js': { visitRoot: script },
            'before.js': { visitRoot: () => Promise.resolve(rootNodeWith('updated')) },
        },
    );

    await runScripts('apple');

    expect(script).toHaveBeenCalledExactlyOnceWith(rootNodeWith('updated'));
});

test('it runs the visitors of a script in order and awaits each of them', async () => {
    const events: string[] = [];
    const first = async () => {
        events.push('first:start');
        await new Promise(resolve => setTimeout(resolve, 10));
        events.push('first:end');
        return rootNodeWith('updated');
    };
    const second = (root: RootNode) => {
        events.push(`second:${root.program.identifier}`);
    };
    mockModules(
        { idl: './idl.json', scripts: { apple: ['./first.js', './second.js'] } },
        { 'first.js': { visitRoot: first }, 'second.js': { visitRoot: second } },
    );

    await runScripts('apple');

    expect(events).toEqual(['first:start', 'first:end', 'second:updated']);
});

test('it rejects when an async visitor rejects', async () => {
    const failure = new Error('Visitor failed');
    mockModules(
        { before: ['./before.js'], idl: './idl.json' },
        { 'before.js': { visitRoot: () => Promise.reject(failure) } },
    );

    await expect(runScripts()).rejects.toThrow(failure);
});
