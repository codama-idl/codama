import { dirname as pathDirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { camelCase, kebabCase, pascalCase, snakeCase, titleCase } from '@codama/nodes';
import nunjucks, { ConfigureOptions as NunJucksOptions } from 'nunjucks';

export function rustDocblock(docs: string[]): string {
    if (docs.length <= 0) return '';
    const lines = docs.map(doc => `/// ${doc}`);
    return `${lines.join('\n')}\n`;
}

export const render = (template: string, context?: object, options?: NunJucksOptions): string => {
    // @ts-expect-error import.meta will be used in the right environment.
    const dirname = __ESM__ ? pathDirname(fileURLToPath(import.meta.url)) : __dirname;
    const templates = __TEST__ ? join(dirname, '..', '..', 'public', 'templates') : join(dirname, 'templates'); // Path to templates from bundled output file.
    const env = nunjucks.configure(templates, { autoescape: false, trimBlocks: true, ...options });
    env.addFilter('pascalCase', pascalCase);
    env.addFilter('camelCase', camelCase);
    env.addFilter('snakeCase', snakeCase);
    env.addFilter('kebabCase', kebabCase);
    env.addFilter('titleCase', titleCase);
    env.addFilter('rustDocblock', rustDocblock);

    // Returns whether or not the provided traits are implemented on the type.
    env.addFilter('hasTrait', (traits: string, ...traitNames: string[]) => {
        if (typeof traits !== 'string') return false;
        return traitNames.some(traitName => traits.includes(traitName));
    });

    return env.render(template, context);
};
