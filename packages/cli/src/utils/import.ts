import { createRequire } from 'node:module';

import { canRead, isLocalModulePath, resolveRelativePath } from './fs';

export async function importModuleItem<T = unknown>(
    identifier: string,
    modulePath: string,
    itemName: string = 'default',
): Promise<T> {
    const module = await importModule(identifier, modulePath);
    const item = pickModuleItem(module, itemName) as T | undefined;
    if (item === undefined) {
        throw new Error(`Failed to import "${itemName}" from ${identifier} at "${modulePath}".`);
    }
    return item;
}

type ModuleDefinition = Partial<Record<string, unknown>> & {
    __esModule?: boolean;
    default?: Partial<Record<string, unknown>> & { default?: Partial<Record<string, unknown>> };
};

function pickModuleItem(module: ModuleDefinition, itemName: string): unknown {
    if (itemName === 'default') {
        return module.default?.default ?? module.default ?? module;
    }
    return module[itemName] ?? module.default?.[itemName] ?? module.default?.default?.[itemName];
}

async function importModule<T extends object>(identifier: string, modulePath: string): Promise<T> {
    if (isLocalModulePath(modulePath)) {
        return await importLocalModule(identifier, modulePath);
    }

    try {
        return await importExternalUserModule(identifier, modulePath);
    } catch {
        return await importExternalModule(identifier, modulePath);
    }
}

async function importLocalModule<T extends object>(identifier: string, modulePath: string): Promise<T> {
    if (!(await canRead(modulePath))) {
        throw new Error(`Cannot access ${identifier} at "${modulePath}"`);
    }

    const dotIndex = modulePath.lastIndexOf('.');
    const extension = dotIndex === -1 ? undefined : modulePath.slice(dotIndex);
    const modulePromise = extension === '.json' ? import(modulePath, { with: { type: 'json' } }) : import(modulePath);

    try {
        return (await modulePromise) as unknown as T;
    } catch (error) {
        throw new Error(`Failed to import ${identifier} at "${modulePath}" as a local module`, { cause: error });
    }
}

async function importExternalModule<T extends object>(identifier: string, modulePath: string): Promise<T> {
    try {
        return (await import(modulePath)) as unknown as T;
    } catch (error) {
        throw new Error(`Failed to import ${identifier} at "${modulePath}" as a module`, { cause: error });
    }
}

async function importExternalUserModule<T extends object>(identifier: string, modulePath: string): Promise<T> {
    const userPackageJsonPath = resolveRelativePath('package.json');
    const userRequire = createRequire(userPackageJsonPath);
    const userModulePath = userRequire.resolve(modulePath);
    return await importExternalModule<T>(identifier, userModulePath);
}
