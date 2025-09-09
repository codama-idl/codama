import { spawnSync } from 'node:child_process';

import { logError, logWarn } from '@codama/errors';
import { deleteDirectory, writeRenderMapVisitor } from '@codama/renderers-core';
import { rootNodeVisitor, visit } from '@codama/visitors-core';

import { RenderOptions } from '../utils';
import { getRenderMapVisitor } from './getRenderMapVisitor';

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
    if (__NODEJS__) {
        const { stdout, stderr, error } = spawnSync(cmd, args);
        if (error?.message?.includes('ENOENT')) {
            logWarn(`Could not find ${cmd}, skipping formatting.`);
            return;
        }
        if (stdout.length > 0) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            logWarn(`(cargo-fmt) ${stdout || error}`);
        }
        if (stderr.length > 0) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            logError(`(cargo-fmt) ${stderr || error}`);
        }
    } else {
        logWarn('Can only use cargo-fmt in Node environments, skipping formatting.');
    }
}
