import { deleteDirectory, writeRenderMapVisitor } from '@codama/renderers-core';
import { rootNodeVisitor, visit } from '@codama/visitors-core';
import { spawnSync } from 'child_process';

import { GetRenderMapOptions, getRenderMapVisitor } from './getRenderMapVisitor';

export type RenderOptions = GetRenderMapOptions & {
  deleteFolderBeforeRendering?: boolean;
  formatCode?: boolean;
  blackOptions?: string[];
};

const DEFAULT_BLACK_OPTIONS = ['--line-length', '88', '--target-version', 'py311'];

export function renderVisitor(path: string, options: RenderOptions = {}) {
  return rootNodeVisitor(root => {
    // Delete existing generated folder.
    if (options.deleteFolderBeforeRendering ?? true) {
      deleteDirectory(path);
    }

    // Render the new files.
    const renderMap = visit(root, getRenderMapVisitor(options));

    // Format the code.
    if (options.formatCode ?? true) {
      renderMap.write(path);
      runFormatter('black', [...(options.blackOptions || DEFAULT_BLACK_OPTIONS), path]);
    } else {
      renderMap.write(path);
    }
  });
}

function runFormatter(cmd: string, args: string[]) {
  const { stdout, stderr, error } = spawnSync(cmd, args);
  if (error?.message?.includes('ENOENT')) {
    console.warn(`Could not find ${cmd}, skipping formatting.`);
    return;
  }
  if (stdout.length > 0) {
    console.log(`(${cmd}) ${stdout.toString()}`);
  }
  if (stderr.length > 0) {
    console.error(`(${cmd}) ${stderr.toString()}`);
  }
} 