import { fileURLToPath } from 'node:url';

import { joinPath, pathDirectory } from '@codama/fragments';

/**
 * Resolve the absolute path to the monorepo root. The compiled bin
 * lives at `<repoRoot>/packages/spec-generators/dist/<entry>.mjs`;
 * resolving three levels up lands in the workspace root.
 */
export function getRepoDirectory(): string {
    const here = pathDirectory(fileURLToPath(import.meta.url));
    return joinPath(here, '..', '..', '..');
}
