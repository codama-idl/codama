import { AccountNode } from '@codama/nodes';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, fragment } from './common';
import { getTypeWithCodecFragment } from './typeWithCodec';

export function getAccountTypeFragment(
    scope: Pick<GlobalFragmentScope, 'customAccountData' | 'nameApi'> & {
        accountNode: AccountNode;
        typeManifest: TypeManifest;
    },
): Fragment {
    const { accountNode, typeManifest, nameApi, customAccountData } = scope;

    if (customAccountData.has(accountNode.name)) {
        return fragment('');
    }

    return getTypeWithCodecFragment({
        manifest: typeManifest,
        name: accountNode.name,
        nameApi,
    });
}
