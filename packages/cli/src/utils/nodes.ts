import type { RootNode } from '@codama/nodes';

import { CliError } from './errors';
import { importModuleItem } from './import';
import { installMissingDependencies } from './packageInstall';

export async function getRootNodeFromIdl(idl: unknown): Promise<RootNode> {
    if (typeof idl !== 'object' || idl === null) {
        throw new CliError('Unexpected IDL content. Expected an object, got ' + typeof idl);
    }
    if (isRootNode(idl)) {
        return idl;
    }

    // Resolve an already-installed adapter first — this works without a package.json.
    // Only the import is guarded: a conversion error from the adapter must surface, not trigger an install.
    let rootNodeFromAnchor: ((idl: unknown) => RootNode) | undefined;
    try {
        rootNodeFromAnchor = await importModuleItem<(idl: unknown) => RootNode>({
            from: '@codama/nodes-from-anchor',
            item: 'rootNodeFromAnchor',
        });
    } catch {
        // Adapter not resolvable directly; fall back to the install flow below.
    }
    if (rootNodeFromAnchor) {
        return rootNodeFromAnchor(idl);
    }

    const hasNodesFromAnchor = await installMissingDependencies(
        'Anchor IDL detected. Additional dependencies are required to process Anchor IDLs.',
        ['@codama/nodes-from-anchor'],
    );
    if (!hasNodesFromAnchor) {
        throw new CliError('Cannot proceed without Anchor IDL support.');
    }

    rootNodeFromAnchor = await importModuleItem<(idl: unknown) => RootNode>({
        from: '@codama/nodes-from-anchor',
        item: 'rootNodeFromAnchor',
    });
    return rootNodeFromAnchor(idl);
}

export function isRootNode(value: unknown): value is RootNode {
    return (
        typeof value === 'object' &&
        value !== null &&
        (value as { standard?: string }).standard === 'codama' &&
        (value as { kind?: string }).kind === 'rootNode'
    );
}
