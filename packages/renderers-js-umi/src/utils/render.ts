import { camelCase, kebabCase, pascalCase, snakeCase, titleCase } from '@kinobi-so/nodes';
import nunjucks, { ConfigureOptions as NunJucksOptions } from 'nunjucks';

export function jsDocblock(docs: string[]): string {
    if (docs.length <= 0) return '';
    if (docs.length === 1) return `/** ${docs[0]} */\n`;
    const lines = docs.map(doc => ` * ${doc}`);
    return `/**\n${lines.join('\n')}\n */\n`;
}

export const render = (directory: string, file: string, context?: object, options?: NunJucksOptions): string => {
    const env = nunjucks.configure(directory, { autoescape: false, trimBlocks: true, ...options });
    env.addFilter('pascalCase', pascalCase);
    env.addFilter('camelCase', camelCase);
    env.addFilter('snakeCase', snakeCase);
    env.addFilter('kebabCase', kebabCase);
    env.addFilter('titleCase', titleCase);
    env.addFilter('jsDocblock', jsDocblock);
    return env.render(file, context);
};
