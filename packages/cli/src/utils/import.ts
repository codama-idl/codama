import { createRequire } from 'node:module';

import pico from 'picocolors';

import { CliError } from './errors';
import { canRead, isLocalModulePath, resolveRelativePath } from './fs';

type ImportModuleItemOptions = {
    from: string;
    identifier?: string;
    item?: string;
};

export async function importModuleItem<T = unknown>(options: ImportModuleItemOptions): Promise<T> {
    const module = await importModule(options);
    const moduleItem = pickModuleItem(module, options.item) as T | undefined;
    if (moduleItem === undefined) {
        const items = getErrorItems(options);
        throw new CliError(`Failed to load ${options.identifier ?? 'module'}.`, items);
    }
    return moduleItem;
}

type ModuleDefinition = Partial<Record<string, unknown>> & {
    __esModule?: boolean;
    default?: Partial<Record<string, unknown>> & { default?: Partial<Record<string, unknown>> };
};

function pickModuleItem(module: ModuleDefinition, item: string = 'default'): unknown {
    if (item === 'default') {
        return module.default?.default ?? module.default ?? module;
    }
    return module[item] ?? module.default?.[item] ?? module.default?.default?.[item];
}

async function importModule<T extends object>(options: ImportModuleItemOptions): Promise<T> {
    if (isLocalModulePath(options.from)) {
        return await importLocalModule(options);
    }

    try {
        return await importExternalUserModule(options);
    } catch {
        return await importExternalModule(options);
    }
}

async function importLocalModule<T extends object>(options: ImportModuleItemOptions): Promise<T> {
    const { from, identifier } = options;
    if (!(await canRead(from))) {
        const items = getErrorItems(options);
        throw new CliError(`Cannot access ${identifier ?? 'module'}.`, items);
    }

    const dotIndex = from.lastIndexOf('.');
    const extension = dotIndex === -1 ? undefined : from.slice(dotIndex);
    const modulePromise = extension === '.json' ? import(from, { with: { type: 'json' } }) : import(from);
    return await handleImportPromise(modulePromise, options);
}

async function importExternalModule<T extends object>(options: ImportModuleItemOptions): Promise<T> {
    return await handleImportPromise(import(options.from), options);
}

async function importExternalUserModule<T extends object>(options: ImportModuleItemOptions): Promise<T> {
    const userPackageJsonPath = resolveRelativePath('package.json');
    const userRequire = createRequire(userPackageJsonPath);
    const userFrom = userRequire.resolve(options.from);
    return await importExternalModule<T>({ ...options, from: userFrom });
}

async function handleImportPromise<T extends object>(
    importPromise: Promise<unknown>,
    options: ImportModuleItemOptions,
): Promise<T> {
    try {
        return (await importPromise) as T;
    } catch (cause) {
        const items = getErrorItems(options, cause);
        throw new CliError(`Failed to load ${options.identifier ?? 'module'}.`, items, { cause });
    }
}

function getErrorItems(options: ImportModuleItemOptions, cause?: unknown): string[] {
    const { from, item } = options;
    const items = [`${pico.bold('Module')}: ${from}`];
    if (item) {
        items.push(`${pico.bold('Item')}: ${item}`);
    }

    const hasCause = !!cause && typeof cause === 'object' && 'message' in cause && typeof cause.message === 'string';
    if (hasCause) {
        items.push(`${pico.bold('Caused by')}: ${(cause as { message: string }).message}`);
    }

    return items;
}
