import type { RootNode } from '@codama/nodes';
import { type AnchorIdl, rootNodeFromAnchor } from '@codama/nodes-from-anchor';

export function getRootNodeFromIdl(idl: unknown): RootNode {
    if (typeof idl !== 'object' || idl === null) {
        throw new Error('Unexpected IDL content. Expected an object, got ' + typeof idl);
    }
    if (isRootNode(idl)) {
        return idl;
    }
    return rootNodeFromAnchor(idl as AnchorIdl);
}

export function isRootNode(value: unknown): value is RootNode {
    return (
        typeof value === 'object' &&
        value !== null &&
        (value as { standard?: string }).standard === 'codama' &&
        (value as { kind?: string }).kind === 'rootNode'
    );
}
