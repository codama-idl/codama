import type { RootNode } from '@codama/nodes';

import { CliError } from './errors';
import { importOptionalDependency } from './optionalDependency';

type RootNodeFromAnchor = (idl: unknown) => RootNode;
export type GetRootNodeFromIdlOptions = { npxCommandArgs?: string[] };

export async function getRootNodeFromIdl(idl: unknown, options: GetRootNodeFromIdlOptions = {}): Promise<RootNode> {
    if (typeof idl !== 'object' || idl === null) {
        throw new CliError('Unexpected IDL content. Expected an object, got ' + typeof idl);
    }
    if (isRootNode(idl)) {
        return idl;
    }

    const rootNodeFromAnchor = await importOptionalDependency<RootNodeFromAnchor>({
        feature: 'Anchor IDL',
        from: '@codama/nodes-from-anchor',
        installMessage: 'Anchor IDL detected. Additional dependencies are required to process Anchor IDLs.',
        item: 'rootNodeFromAnchor',
        npxCommandArgs: options.npxCommandArgs,
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
