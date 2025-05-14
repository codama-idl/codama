import { AccountNode } from '@codama/nodes';
import { getLastNodeFromPath, NodePath } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { Fragment, fragment, fragmentFromTemplate } from './common';

export function getAccountSizeHelpersFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & { accountPath: NodePath<AccountNode> },
): Fragment {
    const { accountPath, nameApi } = scope;
    const accountNode = getLastNodeFromPath(accountPath);
    if (accountNode.size == null) {
        return fragment('');
    }

    return fragmentFromTemplate('accountSizeHelpers.njk', {
        account: accountNode,
        getSizeFunction: nameApi.accountGetSizeFunction(accountNode.name),
    });
}
