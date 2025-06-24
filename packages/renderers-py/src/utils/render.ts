import { dirname as pathDirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { camelCase, kebabCase, pascalCase, PdaSeedNode, snakeCase, titleCase } from '@codama/nodes';
import nunjucks, { ConfigureOptions as NunJucksOptions } from 'nunjucks';

import { getSeed, getSeedType } from '../seeds';

export function jsDocblock(docs: string[]): string {
    if (docs.length <= 0) return '';
    if (docs.length === 1) return `/** ${docs[0]} */\n`;
    const lines = docs.map(doc => ` * ${doc}`);
    return `/**\n${lines.join('\n')}\n */\n`;
}
export function notPyKeyCase(name: string): string {
    if (name == 'global') {
        return 'global_';
    }
    if (name == 'None') {
        return 'None_';
    }
    return name;
}
// Configure common filters and globals for Nunjucks environment
function configureNunjucksEnvironment(env: nunjucks.Environment): void {
    // Add filters
    env.addFilter('pascalCase', pascalCase);
    env.addFilter('camelCase', camelCase);
    env.addFilter('snakeCase', snakeCase);
    env.addFilter('kebabCase', kebabCase);
    env.addFilter('titleCase', titleCase);
    env.addFilter('toUpperCase', function (str: string): string {
        return str.toUpperCase();
    });
    env.addFilter('notKeywordCase', notPyKeyCase);
    env.addFilter('jsDocblock', jsDocblock);
    env.addFilter('dump', function (obj) {
        return JSON.stringify(obj, null, 2);
    });

    // Add globals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Temporary for legacy compatibility
    env.addGlobal('dump', function (obj: any) {
        return JSON.stringify(obj, null, 2);
    });
    env.addGlobal('filterByField', function (array: PdaSeedNode[], fieldName: string): PdaSeedNode[] {
        if (!Array.isArray(array)) return [];
        return array.filter(item => item && typeof item === 'object' && fieldName in item);
    });
    env.addGlobal('getSeed', function (seed: PdaSeedNode): string {
        return getSeed(seed);
    });
    env.addGlobal('getSeedType', function (seed: PdaSeedNode): string {
        return getSeedType(seed);
    });
}

export const render = (template: string, context?: object, options?: NunJucksOptions): string => {
    // @ts-expect-error import.meta will be used in the right environment.
    const dirname = __ESM__ ? pathDirname(fileURLToPath(import.meta.url)) : __dirname;
    const templates = __TEST__ ? join(dirname, '..', '..', 'public', 'templates') : join(dirname, 'templates'); // Path to templates from bundled output file.
    const env = nunjucks.configure(templates, { autoescape: false, trimBlocks: true, ...options });
    configureNunjucksEnvironment(env);

    return env.render(template, context);
};

export const renderString = (template: string, context?: object): string => {
    const env = nunjucks.configure({ autoescape: false });
    configureNunjucksEnvironment(env);
    return env.renderString(template, context!);
};
