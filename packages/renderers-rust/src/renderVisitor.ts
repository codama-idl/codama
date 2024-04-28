import { deleteDirectory, writeRenderMapVisitor } from '@kinobi-so/renderers-core';
import { rootNodeVisitor, visit } from '@kinobi-so/visitors-core';
import { spawnSync } from 'child_process';

import { GetRenderMapOptions, getRenderMapVisitor } from './getRenderMapVisitor';

export type RenderOptions = GetRenderMapOptions & {
    crateFolder?: string;
    deleteFolderBeforeRendering?: boolean;
    formatCode?: boolean;
};

export function renderVisitor(path: string, options: RenderOptions = {}) {
    return rootNodeVisitor(root => {
        // Delete existing generated folder.
        if (options.deleteFolderBeforeRendering ?? true) {
            deleteDirectory(path);
        }

        // Render the new files.
        visit(root, writeRenderMapVisitor(getRenderMapVisitor(options), path));

        // format the code
        if (options.formatCode) {
            if (options.crateFolder) {
                runFormatter('cargo-fmt', ['--manifest-path', `${options.crateFolder}/Cargo.toml`]);
            } else {
                // TODO: logs?
                // logWarn('No crate folder specified, skipping formatting.');
            }
        }
    });
}

function runFormatter(cmd: string, args: string[]) {
    const { stdout, stderr, error } = spawnSync(cmd, args);
    if (error?.message?.includes('ENOENT')) {
        // TODO: logs?
        // logWarn(`Could not find ${cmd}, skipping formatting.`);
        return;
    }
    if (stdout.length > 0) {
        // TODO: logs?
        // logWarn(`(cargo-fmt) ${stdout || error}`);
    }
    if (stderr.length > 0) {
        // TODO: logs?
        // logError(`(cargo-fmt) ${stderr || error}`);
    }
}
