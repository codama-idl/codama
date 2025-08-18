import type { RootNode } from '@codama/nodes';
import { Command } from 'commander';

import { Config, getConfig, ScriptName, ScriptsConfig, VisitorConfig, VisitorPath } from './config';
import { ProgramOptions } from './programOptions';
import {
    CliError,
    getRootNodeFromIdl,
    importModuleItem,
    isLocalModulePath,
    resolveConfigPath,
    resolveRelativePath,
} from './utils';

export type ParsedConfig = Readonly<{
    configPath: string | null;
    idlContent: unknown;
    idlPath: string;
    rootNode: RootNode;
    scripts: ParsedScriptsConfig;
    before: readonly ParsedVisitorConfig[];
}>;

export type ParsedScriptsConfig = Readonly<Record<ScriptName, readonly ParsedVisitorConfig[]>>;
export type ParsedVisitorConfig<T extends readonly unknown[] = readonly unknown[]> = Readonly<{
    args: T;
    index: number;
    item: string | undefined;
    path: VisitorPath;
    script: ScriptName | null;
}>;

export async function getParsedConfigFromCommand(cmd: Command): Promise<ParsedConfig> {
    return await getParsedConfig(cmd.optsWithGlobals());
}

export async function getParsedConfig(options: Pick<ProgramOptions, 'config' | 'idl'>): Promise<ParsedConfig> {
    const [config, configPath] = await getConfig(options);
    return await parseConfig(config, configPath, options);
}

async function parseConfig(
    config: Config,
    configPath: string | null,
    options: Pick<ProgramOptions, 'idl'>,
): Promise<ParsedConfig> {
    const idlPath = parseIdlPath(config, configPath, options);
    const idlContent = await importModuleItem({ identifier: 'IDL', from: idlPath });
    const rootNode = await getRootNodeFromIdl(idlContent);
    const scripts = parseScripts(config.scripts ?? {}, configPath);
    const visitors = (config.before ?? []).map((v, i) => parseVisitorConfig(v, configPath, i, null));

    return { configPath, idlContent, idlPath, rootNode, scripts, before: visitors };
}

function parseIdlPath(
    config: Pick<Config, 'idl'>,
    configPath: string | null,
    options: Pick<ProgramOptions, 'idl'>,
): string {
    if (options.idl) {
        return resolveRelativePath(options.idl);
    }
    if (config.idl) {
        return resolveConfigPath(config.idl, configPath);
    }
    throw new CliError('No IDL identified. Please provide the `--idl` option or set it in the configuration file.');
}

function parseScripts(scripts: ScriptsConfig, configPath: string | null): ParsedScriptsConfig {
    const entryPromises = Object.entries(scripts).map(([name, scriptConfig]) => {
        const visitors: readonly VisitorConfig[] = Array.isArray(scriptConfig) ? scriptConfig : [scriptConfig];
        return [name, visitors.map((v, i) => parseVisitorConfig(v, configPath, i, name))] as const;
    });
    return Object.fromEntries(entryPromises);
}

function parseVisitorConfig<T extends readonly unknown[]>(
    visitorConfig: VisitorConfig<T>,
    configPath: string | null,
    index: number,
    script: ScriptName | null,
): ParsedVisitorConfig<T> {
    const emptyArgs = [] as readonly unknown[] as T;
    const visitorPath = typeof visitorConfig === 'string' ? visitorConfig : visitorConfig.from;
    const visitorArgs = typeof visitorConfig === 'string' ? emptyArgs : (visitorConfig.args ?? emptyArgs);
    const [path, item] = resolveVisitorPath(visitorPath, configPath);
    return { args: visitorArgs, index, item, path, script };
}

function resolveVisitorPath(visitorPath: string, configPath: string | null): readonly [string, string | undefined] {
    const [modulePath, itemName] = visitorPath.split('#') as [string, string | undefined];
    const resolveModulePath = isLocalModulePath(modulePath) ? resolveConfigPath(modulePath, configPath) : modulePath;
    return [resolveModulePath, itemName];
}
