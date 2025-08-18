import { Command } from 'commander';
import pico from 'picocolors';
import prompts, { PromptType } from 'prompts';

import { Config, ScriptConfig, ScriptName } from '../config';
import {
    canRead,
    CliError,
    importModuleItem,
    installMissingDependencies,
    isRootNode,
    logBanner,
    logSuccess,
    PROMPT_OPTIONS,
    resolveRelativePath,
    writeFile,
} from '../utils';

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

async function doInit(explicitOutput: string | undefined, options: InitOptions) {
    const output = getOutputPath(explicitOutput, options);
    const configFileType = getConfigFileType(output, options);

    if (await canRead(output)) {
        throw new CliError(`Configuration file already exists.`, [`${pico.bold('Path')}: ${output}`]);
    }

    // Start prompts.
    logBanner();
    const result = await getPromptResult(options, configFileType);

    // Check dependencies.
    const isAnchor = await isAnchorIdl(result.idlPath);
    await installMissingDependencies(`Your configuration requires additional dependencies.`, [
        ...(isAnchor ? ['@codama/nodes-from-anchor'] : []),
        ...(result.scripts.includes('js') ? ['@codama/renderers-js'] : []),
        ...(result.scripts.includes('rust') ? ['@codama/renderers-rust'] : []),
    ]);

    // Write configuration file.
    const content = getContentFromPromptResult(result, configFileType);
    await writeFile(output, content);
    console.log();
    logSuccess(pico.bold('Configuration file created.'), [`${pico.bold('Path')}: ${output}`]);
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

async function getPromptResult(
    options: Pick<InitOptions, 'default'>,
    configFileType: ConfigFileType,
): Promise<PromptResult> {
    const defaults = getDefaultPromptResult();
    if (options.default) {
        return defaults;
    }

    const hasScript =
        (script: string, type: PromptType = 'text') =>
        (_: unknown, values: { scripts: string[] }) =>
            values.scripts.includes(script) ? type : null;
    return await prompts(
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
                onRender() {
                    if (configFileType === 'gill') {
                        const value = (this as unknown as { value: prompts.Choice[] }).value;
                        const jsChoice = value.find(choice => choice.value === 'js')!;
                        jsChoice.description = pico.yellow('Required with --gill option.');
                        jsChoice.selected = true;
                    }
                },
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
        PROMPT_OPTIONS,
    );
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

type ConfigFileType = 'gill' | 'js' | 'json';
function getConfigFileType(output: string, options: Pick<InitOptions, 'gill' | 'js'>): ConfigFileType {
    if (options.gill) return 'gill';
    else if (options.js) return 'js';
    return output.endsWith('.js') ? 'js' : 'json';
}

function getContentFromPromptResult(result: PromptResult, configFileType: ConfigFileType): string {
    switch (configFileType) {
        case 'gill':
            return getContentForGill(result);
        case 'js':
            return (
                `export default ` +
                JSON.stringify(getConfigFromPromptResult(result), null, 4)
                    // Remove quotes around property names
                    .replace(/"([^"]+)":/g, '$1:')
                    // Convert double-quoted strings to single quotes
                    .replace(/"([^"]*)"/g, "'$1'")
            );
        case 'json':
        default:
            return JSON.stringify(getConfigFromPromptResult(result), null, 4);
    }
}

function getConfigFromPromptResult(result: PromptResult): Config {
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
    return { idl: result.idlPath, before: [], scripts };
}

function getContentForGill(result: PromptResult): string {
    const attributes: string[] = [
        `idl: "${result.idlPath}"`,
        `clientJs: "${result.jsPath}"`,
        ...(result.scripts.includes('rust') ? [`clientRust: "${result.rustPath}"`] : []),
    ];
    const attributesString = attributes.map(attr => `    ${attr},\n`).join('');

    return (
        `import { createCodamaConfig } from "gill";\n\n` +
        `export default createCodamaConfig({\n${attributesString}});\n`
    );
}

async function isAnchorIdl(idlPath: string): Promise<boolean> {
    const resolvedIdlPath = resolveRelativePath(idlPath);
    if (!(await canRead(resolvedIdlPath))) return false;
    try {
        const idlContent = await importModuleItem({ identifier: 'IDL', from: resolvedIdlPath });
        return !isRootNode(idlContent);
    } catch {
        return false;
    }
}
