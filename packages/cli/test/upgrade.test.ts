import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type { RootNode } from '@codama/nodes';
import pico from 'picocolors';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { createProgram } from '../src';
import { CliError } from '../src/utils/errors';
import { importModuleItem } from '../src/utils/import';
import { installMissingDependencies } from '../src/utils/packageInstall';
import { tryGetPackageJson } from '../src/utils/packageJson';

vi.mock('../src/utils/import', () => ({ importModuleItem: vi.fn() }));
vi.mock('../src/utils/packageInstall', () => ({ installMissingDependencies: vi.fn() }));
vi.mock('../src/utils/packageJson', () => ({ tryGetPackageJson: vi.fn() }));

const importModuleItemMock = vi.mocked(importModuleItem);
const installMissingDependenciesMock = vi.mocked(installMissingDependencies);
const tryGetPackageJsonMock = vi.mocked(tryGetPackageJson);

const oldIdl = {
    kind: 'rootNode',
    program: { kind: 'programNode', name: 'myProgram' },
    standard: 'codama',
    version: '1.0.0',
};
const upgradedIdl = {
    kind: 'rootNode',
    program: { identifier: 'myProgram', kind: 'programNode' },
    standard: 'codama',
    version: '2.0.0',
};
const upgrade = vi.fn<(root: RootNode) => RootNode>(() => upgradedIdl as unknown as RootNode);

let directory: string;
beforeEach(() => {
    vi.resetAllMocks();
    upgrade.mockImplementation(() => upgradedIdl as unknown as RootNode);
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'codama-upgrade-'));
    vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
    fs.rmSync(directory, { force: true, recursive: true });
    vi.restoreAllMocks();
});

const writeIdl = (name: string, idl: unknown) => {
    const filePath = path.join(directory, name);
    fs.writeFileSync(filePath, JSON.stringify(idl));
    return filePath;
};
const readIdl = (filePath: string): unknown => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const runUpgrade = (...args: string[]) =>
    createProgram({ exitOverride: true, suppressOutput: true }).parseAsync(['upgrade', ...args], { from: 'user' });
const getError = (...args: string[]) =>
    runUpgrade(...args).then(
        () => expect.unreachable('Expected the upgrade to fail.'),
        (cause: unknown) => cause as CliError,
    );
const createMissingModuleError = (moduleName: string) => {
    const cause = Object.assign(new Error(`Cannot find package '${moduleName}'`), { code: 'ERR_MODULE_NOT_FOUND' });
    return new CliError('Failed to load module.', [], { cause });
};

test('it upgrades a Codama IDL in place with the upgrade function of the project', async () => {
    importModuleItemMock.mockResolvedValue(upgrade);
    const idlPath = writeIdl('idl.json', oldIdl);
    await runUpgrade(idlPath);
    expect(importModuleItemMock).toHaveBeenCalledWith({ from: '@codama/upgrade', item: 'upgrade' });
    expect(upgrade).toHaveBeenCalledWith(oldIdl);
    expect(readIdl(idlPath)).toEqual(upgradedIdl);
});

test('it writes the upgraded IDL to the given path and leaves the input untouched', async () => {
    importModuleItemMock.mockResolvedValue(upgrade);
    const idlPath = writeIdl('idl.json', oldIdl);
    const outPath = path.join(directory, 'nested', 'upgraded.json');
    await runUpgrade(idlPath, outPath);
    expect(readIdl(idlPath)).toEqual(oldIdl);
    expect(readIdl(outPath)).toEqual(upgradedIdl);
});

test('it leaves IDLs already on the latest major untouched', async () => {
    // Given an IDL whose major the upgrade function keeps, restamping its version.
    const latestIdl = { ...upgradedIdl, version: '2.1.0' };
    importModuleItemMock.mockResolvedValue(upgrade);
    const idlPath = path.join(directory, 'idl.json');
    const content = `${JSON.stringify(latestIdl, null, 4)}\n`;
    fs.writeFileSync(idlPath, content);
    const outPath = path.join(directory, 'upgraded.json');

    await runUpgrade(idlPath, outPath);

    // Then the file is kept byte for byte, its version is not relabelled, and nothing is written.
    expect(upgrade).toHaveBeenCalledWith(latestIdl);
    expect(fs.readFileSync(idlPath, 'utf8')).toBe(content);
    expect(fs.existsSync(outPath)).toBe(false);
});

test('it rejects IDLs that are not Codama IDLs without loading the upgrade package', async () => {
    const idlPath = writeIdl('anchor.json', { instructions: [], metadata: { spec: '0.1.0' } });
    const error = await getError(idlPath);
    expect(error).toBeInstanceOf(CliError);
    expect(error.message).toBe('Only Codama IDLs can be upgraded.');
    expect(importModuleItemMock).not.toHaveBeenCalled();
});

test('it surfaces errors of the upgrade function and leaves the IDL untouched', async () => {
    const failure = new Error('Unsupported version');
    upgrade.mockImplementation(() => {
        throw failure;
    });
    importModuleItemMock.mockResolvedValue(upgrade);
    const idlPath = writeIdl('idl.json', oldIdl);
    expect(await getError(idlPath)).toBe(failure);
    expect(readIdl(idlPath)).toEqual(oldIdl);
});

test('it suggests npx without installing when package.json and the upgrade package are missing', async () => {
    importModuleItemMock.mockRejectedValue(createMissingModuleError('@codama/upgrade'));
    tryGetPackageJsonMock.mockResolvedValue(undefined);
    const idlPath = writeIdl('idl.json', oldIdl);

    const error = await getError(idlPath, 'out.json');

    expect(error).toBeInstanceOf(CliError);
    expect(error.message).toBe('IDL upgrade support is not available.');
    expect(error.items).toEqual([
        `${pico.bold('Missing dependency')}: @codama/upgrade`,
        'No package.json was found, so Codama did not install dependencies in this directory.',
        `${pico.bold('Re-run with')}: ${pico.yellow(`npx -p codama -p @codama/upgrade codama upgrade ${idlPath} out.json`)}`,
    ]);
    expect(installMissingDependenciesMock).not.toHaveBeenCalled();
    expect(readIdl(idlPath)).toEqual(oldIdl);
});

test('it installs the upgrade package in the project, then upgrades', async () => {
    importModuleItemMock
        .mockRejectedValueOnce(createMissingModuleError('@codama/upgrade'))
        .mockResolvedValueOnce(upgrade);
    tryGetPackageJsonMock.mockResolvedValue({ name: 'example' });
    installMissingDependenciesMock.mockResolvedValue(true);
    const idlPath = writeIdl('idl.json', oldIdl);

    await runUpgrade(idlPath);

    expect(installMissingDependenciesMock).toHaveBeenCalledWith(
        'Upgrading Codama IDLs requires additional dependencies.',
        ['@codama/upgrade'],
    );
    expect(readIdl(idlPath)).toEqual(upgradedIdl);
});

test('it stops when the upgrade package is not installed', async () => {
    importModuleItemMock.mockRejectedValue(createMissingModuleError('@codama/upgrade'));
    tryGetPackageJsonMock.mockResolvedValue({ name: 'example' });
    installMissingDependenciesMock.mockResolvedValue(false);
    const idlPath = writeIdl('idl.json', oldIdl);

    const error = await getError(idlPath);

    expect(error.message).toBe('Cannot proceed without IDL upgrade support.');
    expect(readIdl(idlPath)).toEqual(oldIdl);
});
