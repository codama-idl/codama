import type { RootNode } from '@codama/nodes';

import { importModuleItem } from './import';
import { installMissingDependencies } from './packageInstall';

export async function getRootNodeFromIdl(idl: unknown): Promise<RootNode> {
    if (typeof idl !== 'object' || idl === null) {
        throw new Error('Unexpected IDL content. Expected an object, got ' + typeof idl);
    }
    if (isRootNode(idl)) {
        return idl;
    }

    const hasNodesFromAnchor = await installMissingDependencies(
        'Anchor IDL detected. Additional dependencies are required to process Anchor IDLs.',
        ['@codama/nodes-from-anchor'],
    );
    if (!hasNodesFromAnchor) {
        throw new Error('Cannot proceed without Anchor IDL support. Install cancelled by user.');
    }

    const rootNodeFromAnchor = await importModuleItem<(idl: unknown) => RootNode>({
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
