import { AccountNode } from '@codama/nodes';
import { getLastNodeFromPath, NodePath } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, fragment } from './common';
import { getTypeWithCodecFragment } from './typeWithCodec';

export function getAccountTypeFragment(
    scope: Pick<GlobalFragmentScope, 'customAccountData' | 'nameApi'> & {
        accountPath: NodePath<AccountNode>;
        size: number | null;
        typeManifest: TypeManifest;
    },
): Fragment {
    const { accountPath, typeManifest, nameApi, customAccountData } = scope;
    const accountNode = getLastNodeFromPath(accountPath);

    if (customAccountData.has(accountNode.name)) {
        return fragment('');
    }

    return getTypeWithCodecFragment({
        manifest: typeManifest,
        name: accountNode.name,
        nameApi,
        size: scope.size,
    });
}
