import pico from 'picocolors';

import { CliError } from './errors';
import { importModuleItem } from './import';
import { installMissingDependencies } from './packageInstall';
import { tryGetPackageJson } from './packageJson';

export type ImportOptionalDependencyOptions = {
    /** The package to import, e.g. `@codama/nodes-from-anchor`. */
    from: string;
    /** The item to import from the package, e.g. `rootNodeFromAnchor`. */
    item: string;
    /** What the package provides, used in messages, e.g. `Anchor IDL` for "Anchor IDL support is not available." */
    feature: string;
    /** The message explaining why the package is about to be installed. */
    installMessage: string;
    /** The arguments of the current command, to suggest re-running it with `npx` when nothing can be installed. */
    npxCommandArgs?: string[];
};

/**
 * Import an item from a package the CLI does not depend on, from the user's project. When the
 * package is missing, offer to install it in the project, or suggest re-running the command with
 * `npx` when there is no `package.json` to install it in. The user's own version of the package
 * is used, so the CLI stays independent of it.
 */
export async function importOptionalDependency<T>(options: ImportOptionalDependencyOptions): Promise<T> {
    return (await tryImportOptionalDependency<T>(options)) ?? (await resolveOptionalDependency<T>(options));
}

async function tryImportOptionalDependency<T>(options: ImportOptionalDependencyOptions): Promise<T | undefined> {
    try {
        return await importModuleItem<T>({ from: options.from, item: options.item });
    } catch (error) {
        if (isMissingModuleError(error)) return undefined;
        throw error;
    }
}

async function resolveOptionalDependency<T>(options: ImportOptionalDependencyOptions): Promise<T> {
    if (!(await tryGetPackageJson())) {
        throw new CliError(`${options.feature} support is not available.`, [
            `${pico.bold('Missing dependency')}: ${options.from}`,
            'No package.json was found, so Codama did not install dependencies in this directory.',
            `${pico.bold('Re-run with')}: ${pico.yellow(getNpxCommand(options))}`,
        ]);
    }

    const isInstalled = await installMissingDependencies(options.installMessage, [options.from]);
    if (!isInstalled) {
        throw new CliError(`Cannot proceed without ${options.feature} support.`);
    }

    return await importModuleItem<T>({ from: options.from, item: options.item });
}

function getNpxCommand(options: ImportOptionalDependencyOptions): string {
    const commandArgs = options.npxCommandArgs ?? ['[...]'];
    return ['npx', '-p', 'codama', '-p', options.from, 'codama', ...commandArgs].join(' ');
}

function isMissingModuleError(error: unknown): boolean {
    for (let current: unknown = error; current != null; current = (current as { cause?: unknown }).cause) {
        const { code } = current as { code?: unknown };
        if (code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND') return true;
    }
    return false;
}
