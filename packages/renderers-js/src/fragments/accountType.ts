import { AccountNode, resolveNestedTypeNode } from '@codama/nodes';
import { getLastNodeFromPath, NodePath } from '@codama/visitors-core';

import { Fragment, RenderScope, TypeManifest } from '../utils';
import { getTypeWithCodecFragment } from './typeWithCodec';

export function getAccountTypeFragment(
    scope: Pick<RenderScope, 'customAccountData' | 'nameApi'> & {
        accountPath: NodePath<AccountNode>;
        size: number | null;
        typeManifest: TypeManifest;
    },
): Fragment | undefined {
    const { accountPath, typeManifest, nameApi, customAccountData } = scope;
    const accountNode = getLastNodeFromPath(accountPath);
    if (customAccountData.has(accountNode.name)) return;

    return getTypeWithCodecFragment({
        manifest: typeManifest,
        name: accountNode.name,
        nameApi,
        node: resolveNestedTypeNode(accountNode.data),
        size: scope.size,
    });
}
