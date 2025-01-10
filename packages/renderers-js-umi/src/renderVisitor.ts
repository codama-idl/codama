import { deleteDirectory } from '@codama/renderers-core';
import { LogLevel, throwValidatorItemsVisitor } from '@codama/validators';
import { rootNodeVisitor, visit } from '@codama/visitors-core';
import { Plugin } from 'prettier';
import * as estreePlugin from 'prettier/plugins/estree';
import * as typeScriptPlugin from 'prettier/plugins/typescript';
import { format } from 'prettier/standalone';

import { GetRenderMapOptions, getRenderMapVisitor } from './getRenderMapVisitor';
import { getValidationItemsVisitor } from './getValidatorBagVisitor';

type PrettierOptions = Parameters<typeof format>[1];

export type RenderOptions = GetRenderMapOptions & {
    deleteFolderBeforeRendering?: boolean;
    formatCode?: boolean;
    prettierOptions?: PrettierOptions;
    throwLevel?: LogLevel;
};

const DEFAULT_PRETTIER_OPTIONS: PrettierOptions = {
    arrowParens: 'always',
    parser: 'typescript',
    plugins: [estreePlugin as Plugin<unknown>, typeScriptPlugin],
    printWidth: 80,
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'es5',
    useTabs: false,
};

export function renderVisitor(path: string, options: RenderOptions = {}) {
    return rootNodeVisitor(async root => {
        // Validate nodes.
        visit(root, throwValidatorItemsVisitor(getValidationItemsVisitor(), options.throwLevel));

        // Delete existing generated folder.
        if (options.deleteFolderBeforeRendering ?? true) {
            deleteDirectory(path);
        }

        // Render the new files.
        const renderMap = visit(root, getRenderMapVisitor(options));

        // Format the code.
        if (options.formatCode ?? true) {
            const prettierOptions = { ...DEFAULT_PRETTIER_OPTIONS, ...options.prettierOptions };
            await renderMap.mapContentAsync(code => format(code, prettierOptions));
        }

        renderMap.write(path);
    });
}
