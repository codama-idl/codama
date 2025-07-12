import { logError, logWarn } from '@codama/errors';
import { deleteDirectory, writeRenderMapVisitor } from '@codama/renderers-core';
import { rootNodeVisitor, visit } from '@codama/visitors-core';
import { spawnSync } from 'child_process';

import { GetRenderMapOptions, getRenderMapVisitor } from './getRenderMapVisitor';

export type RenderOptions = GetRenderMapOptions & {
    crateFolder?: string;
    deleteFolderBeforeRendering?: boolean;
    formatCode?: boolean;
    toolchain?: string;
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
                const toolchain = options.toolchain ?? '+stable';
                runFormatter('cargo', [toolchain, 'fmt', '--manifest-path', `${options.crateFolder}/Cargo.toml`]);
            } else {
                logWarn('No crate folder specified, skipping formatting.');
            }
        }
    });
}

function runFormatter(cmd: string, args: string[]) {
    const { stdout, stderr, error } = spawnSync(cmd, args);
    if (error?.message?.includes('ENOENT')) {
        logWarn(`Could not find ${cmd}, skipping formatting.`);
        return;
    }
    if (stdout.length > 0) {
        logWarn(`(cargo-fmt) ${stdout ? stdout?.toString() : error}`);
    }
    if (stderr.length > 0) {
        logError(`(cargo-fmt) ${stdout ? stdout?.toString() : error}`);
    }
}
