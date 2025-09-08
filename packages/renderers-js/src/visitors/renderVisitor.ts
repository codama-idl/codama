import { deleteDirectory, mapRenderMapContentAsync, writeRenderMap } from '@codama/renderers-core';
import { rootNodeVisitor, visit } from '@codama/visitors-core';
import { Plugin } from 'prettier';
import * as estreePlugin from 'prettier/plugins/estree';
import * as typeScriptPlugin from 'prettier/plugins/typescript';
import { format } from 'prettier/standalone';

import { RenderOptions } from '../utils';
import { getRenderMapVisitor } from './getRenderMapVisitor';

type PrettierOptions = Parameters<typeof format>[1];

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
        // Delete existing generated folder.
        if (options.deleteFolderBeforeRendering ?? true) {
            deleteDirectory(path);
        }

        // Render the new files.
        let renderMap = visit(root, getRenderMapVisitor(options));

        // Format the code.
        if (options.formatCode ?? true) {
            const prettierOptions = { ...DEFAULT_PRETTIER_OPTIONS, ...options.prettierOptions };
            renderMap = await mapRenderMapContentAsync(renderMap, code => format(code, prettierOptions));
        }

        writeRenderMap(renderMap, path);
    });
}
