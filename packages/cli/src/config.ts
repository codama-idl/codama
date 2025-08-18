import path from 'node:path';

import pico from 'picocolors';

import { ProgramOptions } from './programOptions';
import { canRead, CliError, importModuleItem, logWarning } from './utils';

export type Config = Readonly<{
    idl?: string;
    scripts?: ScriptsConfig;
    before?: readonly VisitorConfig[];
}>;

export type ScriptName = string;
export type ScriptConfig = VisitorConfig | readonly VisitorConfig[];
export type ScriptsConfig = Readonly<Record<ScriptName, ScriptConfig>>;

export type VisitorPath = string;
export type VisitorConfig<T extends readonly unknown[] = readonly unknown[]> = VisitorConfigObject<T> | VisitorPath;
export type VisitorConfigObject<T extends readonly unknown[] = readonly unknown[]> = Readonly<{
    args?: T;
    from: VisitorPath;
}>;

export async function getConfig(options: Pick<ProgramOptions, 'config'>): Promise<[Config, string | null]> {
    const configPath = options.config != null ? path.resolve(options.config) : await getDefaultConfigPath();

    if (!configPath) {
        logWarning('No configuration file found. Using empty configs. Make sure you provide the `--idl` option.');
        return [{}, configPath];
    }

    const configFile = await importModuleItem({ identifier: 'configuration file', from: configPath });
    if (!configFile || typeof configFile !== 'object') {
        throw new CliError(`Invalid configuration file.`, [`${pico.bold('Path')}: ${configPath}`]);
    }

    return [configFile, configPath];
}

async function getDefaultConfigPath(): Promise<string | null> {
    const candidatePaths = ['codama.js', 'codama.mjs', 'codama.cjs', 'codama.json'];
    for (const candidatePath of candidatePaths) {
        const resolvedPath = path.resolve(process.cwd(), candidatePath);
        if (await canRead(resolvedPath)) {
            return resolvedPath;
        }
    }
    return null;
}
