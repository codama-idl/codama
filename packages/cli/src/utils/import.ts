import { createRequire } from 'node:module';

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
        const moduleInfo = getModuleInfo(options);
        throw new Error(`Failed to ${moduleInfo}.`);
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
    const { identifier, from } = options;
    if (!(await canRead(from))) {
        throw new Error(`Cannot access ${identifier ?? 'module'} at "${from}"`);
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
    } catch (error) {
        const moduleInfo = getModuleInfo(options);
        let causeMessage =
            !!error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
                ? (error as { message: string }).message
                : undefined;
        causeMessage = causeMessage ? `\n(caused by: ${causeMessage})` : '';
        throw new Error(`Failed to ${moduleInfo}.${causeMessage}`, { cause: error });
    }
}

function getModuleInfo(options: ImportModuleItemOptions): string {
    const { identifier, from, item } = options;
    const importStatement = item ? `import { ${item} } from '${from}'` : `import default from '${from}'`;
    if (!identifier) return importStatement;
    return `import ${identifier} [${importStatement}]`;
}
