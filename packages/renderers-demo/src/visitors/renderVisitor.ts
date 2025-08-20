import { deleteDirectory, writeRenderMap } from '@codama/renderers-core';
import { rootNodeVisitor, visit } from '@codama/visitors-core';

import { RenderOptions } from '../utils/options';
import { getRenderMapVisitor } from './getRenderMapVisitor';

export function renderVisitor(path: string, options: RenderOptions = {}) {
    return rootNodeVisitor(root => {
        // Delete existing generated folder.
        if (options.deleteFolderBeforeRendering ?? true) {
            deleteDirectory(path);
        }

        // Render the new files.
        const renderMap = visit(root, getRenderMapVisitor(options));
        writeRenderMap(renderMap, path);
    });
}
