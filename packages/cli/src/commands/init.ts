import { Command } from 'commander';
import prompts, { PromptType } from 'prompts';

import { Config, ScriptConfig, ScriptName } from '../config';
import { canRead, logBanner, logSuccess, resolveRelativePath, writeFile } from '../utils';

export function setInitCommand(program: Command): void {
    program
        .command('init')
        .argument('[output]', 'Optional path used to output the configuration file')
        .option('-d, --default', 'Bypass prompts and select all defaults options')
        .option('--js', 'Forces the output to be a JavaScript file')
        .option('--gill', 'Forces the output to be a gill based JavaScript file')
        .action(doInit);
}

type InitOptions = {
    default?: boolean;
    js?: boolean;
    gill?: boolean;
};

type ConfigFileType = 'gill' | 'js' | 'json';

async function doInit(explicitOutput: string | undefined, options: InitOptions) {
    const output = getOutputPath(explicitOutput, options);
    let configFileType: ConfigFileType = output.endsWith('.js') ? 'js' : 'json';
    if (options.gill) configFileType = 'gill';
    else if (options.js) configFileType = 'js';

    if (await canRead(output)) {
        throw new Error(`Configuration file already exists at "${output}".`);
    }

    logBanner();
    const result = await getPromptResult(options);
    const content = getContentFromPromptResult(result, configFileType);
    await writeFile(output, content);
    logSuccess(`Configuration file created at "${output}".`);
}

function getOutputPath(explicitOutput: string | undefined, options: Pick<InitOptions, 'gill' | 'js'>): string {
    if (explicitOutput) {
        return resolveRelativePath(explicitOutput);
    }
    return resolveRelativePath(options.js || options.gill ? 'codama.js' : 'codama.json');
}

type PromptResult = {
    idlPath: string;
    jsPath?: string;
    rustCrate?: string;
    rustPath?: string;
    scripts: string[];
};

async function getPromptResult(options: Pick<InitOptions, 'default'>): Promise<PromptResult> {
    const defaults = getDefaultPromptResult();
    if (options.default) {
        return defaults;
    }

    const hasScript =
        (script: string, type: PromptType = 'text') =>
        (_: unknown, values: { scripts: string[] }) =>
            values.scripts.includes(script) ? type : null;
    const result: PromptResult = await prompts(
        [
            {
                initial: defaults.idlPath,
                message: 'Where is your IDL located? (Supports Codama and Anchor IDLs).',
                name: 'idlPath',
                type: 'text',
            },
            {
                choices: [
                    { selected: true, title: 'Generate JavaScript client', value: 'js' },
                    { selected: true, title: 'Generate Rust client', value: 'rust' },
                ],
                instructions: '[space] to toggle / [a] to toggle all / [enter] to submit',
                message: 'Which script preset would you like to use?',
                name: 'scripts',
                type: 'multiselect',
            },
            {
                initial: defaults.jsPath,
                message: '[js] Where should the JavaScript code be generated?',
                name: 'jsPath',
                type: hasScript('js'),
            },
            {
                initial: defaults.rustCrate,
                message: '[rust] Where is the Rust client crate located?',
                name: 'rustCrate',
                type: hasScript('rust'),
            },
            {
                initial: (prev: string) => `${prev}/src/generated`,
                message: '[rust] Where should the Rust code be generated?',
                name: 'rustPath',
                type: hasScript('rust'),
            },
        ],
        {
            onCancel: () => {
                throw new Error('Operation cancelled.');
            },
        },
    );

    return result;
}

function getDefaultPromptResult(): PromptResult {
    return {
        idlPath: 'program/idl.json',
        jsPath: 'clients/js/src/generated',
        rustCrate: 'clients/rust',
        rustPath: 'clients/rust/src/generated',
        scripts: ['js', 'rust'],
    };
}

function getContentFromPromptResult(result: PromptResult, configFileType: ConfigFileType): string {
    const scripts: Record<ScriptName, ScriptConfig> = {};
    if (result.scripts.includes('js')) {
        scripts.js = {
            from: '@codama/renderers-js',
            args: [result.jsPath],
        };
    }
    if (result.scripts.includes('rust')) {
        scripts.rust = {
            from: '@codama/renderers-rust',
            args: [result.rustPath, { crateFolder: result.rustCrate, formatCode: true }],
        };
    }
    const content: Config = { idl: result.idlPath, before: [], scripts };

    if (configFileType == 'json') {
        return JSON.stringify(content, null, 4);
    } else if (configFileType == 'gill') {
        return `import { createCodamaConfig } from "gill";\n\n` +
            `export default createCodamaConfig({ \n\t` +
            `idl: "${result.idlPath}", \n\t` +
            `clientJs: "${result.jsPath}", \n` +
            result.scripts.includes('rust')
            ? `clientRust: "${result.rustPath}", \n`
            : `` + `});`;
    }

    return (
        'export default ' +
        JSON.stringify(content, null, 4)
            // Remove quotes around property names
            .replace(/"([^"]+)":/g, '$1:')
            // Convert double-quoted strings to single quotes
            .replace(/"([^"]*)"/g, "'$1'")
    );
}
