import type { RootNode } from '@codama/nodes';
import pico from 'picocolors';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { CliError } from '../src/utils/errors';
import { importModuleItem } from '../src/utils/import';
import { getRootNodeFromIdl } from '../src/utils/nodes';
import { installMissingDependencies } from '../src/utils/packageInstall';
import { tryGetPackageJson } from '../src/utils/packageJson';

vi.mock('../src/utils/import', () => ({ importModuleItem: vi.fn() }));
vi.mock('../src/utils/packageInstall', () => ({ installMissingDependencies: vi.fn() }));
vi.mock('../src/utils/packageJson', () => ({ tryGetPackageJson: vi.fn() }));

const importModuleItemMock = vi.mocked(importModuleItem);
const installMissingDependenciesMock = vi.mocked(installMissingDependencies);
const tryGetPackageJsonMock = vi.mocked(tryGetPackageJson);
const anchorIdl = { instructions: [], metadata: { spec: '0.1.0' } };
const rootNode = { kind: 'rootNode', standard: 'codama' } as RootNode;

describe('getRootNodeFromIdl', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test('uses an already resolvable Anchor adapter without checking package.json', async () => {
        const rootNodeFromAnchor = vi.fn().mockReturnValue(rootNode);
        importModuleItemMock.mockResolvedValue(rootNodeFromAnchor);

        await expect(getRootNodeFromIdl(anchorIdl)).resolves.toBe(rootNode);
        expect(tryGetPackageJsonMock).not.toHaveBeenCalled();
        expect(installMissingDependenciesMock).not.toHaveBeenCalled();
    });

    test('suggests npx without installing when package.json and the adapter are missing', async () => {
        importModuleItemMock.mockRejectedValue(createMissingModuleError('@codama/nodes-from-anchor'));
        tryGetPackageJsonMock.mockResolvedValue(undefined);

        const error = await getRootNodeFromIdl(anchorIdl, {
            npxCommandArgs: ['convert', 'anchor.json', 'codama.json'],
        }).catch((cause: unknown) => cause);

        expect(error).toBeInstanceOf(CliError);
        expect((error as CliError).message).toBe('Anchor IDL support is not available.');
        expect((error as CliError).items).toEqual([
            `${pico.bold('Missing dependency')}: @codama/nodes-from-anchor`,
            'No package.json was found, so Codama did not install dependencies in this directory.',
            `${pico.bold('Re-run with')}: ${pico.yellow(
                'npx -p codama -p @codama/nodes-from-anchor codama convert anchor.json codama.json',
            )}`,
        ]);
        expect(installMissingDependenciesMock).not.toHaveBeenCalled();
    });

    test('keeps the install flow when package.json exists', async () => {
        const rootNodeFromAnchor = vi.fn().mockReturnValue(rootNode);
        importModuleItemMock
            .mockRejectedValueOnce(createMissingModuleError('@codama/nodes-from-anchor'))
            .mockResolvedValueOnce(rootNodeFromAnchor);
        tryGetPackageJsonMock.mockResolvedValue({ name: 'example' });
        installMissingDependenciesMock.mockResolvedValue(true);

        await expect(getRootNodeFromIdl(anchorIdl)).resolves.toBe(rootNode);
        expect(installMissingDependenciesMock).toHaveBeenCalledWith(
            'Anchor IDL detected. Additional dependencies are required to process Anchor IDLs.',
            ['@codama/nodes-from-anchor'],
        );
    });

    test('surfaces adapter load failures instead of treating them as a missing adapter', async () => {
        const loadError = new SyntaxError('Unexpected token');
        importModuleItemMock.mockRejectedValue(loadError);

        await expect(getRootNodeFromIdl(anchorIdl)).rejects.toBe(loadError);
        expect(tryGetPackageJsonMock).not.toHaveBeenCalled();
        expect(installMissingDependenciesMock).not.toHaveBeenCalled();
    });

    test('surfaces missing transitive dependencies from an installed adapter', async () => {
        const loadError = createMissingModuleError('missing-transitive-package');
        importModuleItemMock.mockRejectedValue(loadError);

        await expect(getRootNodeFromIdl(anchorIdl)).rejects.toBe(loadError);
        expect(tryGetPackageJsonMock).not.toHaveBeenCalled();
        expect(installMissingDependenciesMock).not.toHaveBeenCalled();
    });
});

function createMissingModuleError(moduleName: string): CliError {
    const cause = Object.assign(new Error(`Cannot find package '${moduleName}'`), { code: 'ERR_MODULE_NOT_FOUND' });
    return new CliError('Failed to load module.', [], { cause });
}
