import { deleteDirectory } from '@codama/renderers-core';
import { rootNodeVisitor, visit } from '@codama/visitors-core';
//import { Plugin } from 'prettier';
//import * as estreePlugin from 'prettier/plugins/estree';
//import * as typeScriptPlugin from 'prettier/plugins/typescript';
import { format } from 'prettier/standalone';

import { GetRenderMapOptions, getRenderMapVisitor } from './getRenderMapVisitor';

type PrettierOptions = Parameters<typeof format>[1];

export type RenderOptions = GetRenderMapOptions & {
    deleteFolderBeforeRendering?: boolean;
    formatCode?: boolean;
    prettierOptions?: PrettierOptions;
};

export function renderVisitor(path: string, options: RenderOptions = {}) {
    return rootNodeVisitor(root => {
        // Delete existing generated folder.
        if (options.deleteFolderBeforeRendering ?? true) {
            deleteDirectory(path);
        }

        // Render the new files.
        const renderMap = visit(root, getRenderMapVisitor(options));

        renderMap.write(path);
    });
}
