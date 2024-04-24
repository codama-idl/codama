import { AccountNode } from '@kinobi-so/nodes';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { Fragment, fragment, fragmentFromTemplate } from './common';

export function getAccountSizeHelpersFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & { accountNode: AccountNode },
): Fragment {
    const { accountNode, nameApi } = scope;
    if (accountNode.size == null) {
        return fragment('');
    }

    return fragmentFromTemplate('accountSizeHelpers.njk', {
        account: accountNode,
        getSizeFunction: nameApi.accountGetSizeFunction(accountNode.name),
    });
}
