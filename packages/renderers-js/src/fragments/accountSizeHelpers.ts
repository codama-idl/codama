import { AccountNode } from '@codama/nodes';
import { getLastNodeFromPath, NodePath } from '@codama/visitors-core';

import { Fragment, fragment, RenderScope } from '../utils';

export function getAccountSizeHelpersFragment(
    scope: Pick<RenderScope, 'nameApi'> & { accountPath: NodePath<AccountNode> },
): Fragment | undefined {
    const { accountPath, nameApi } = scope;
    const accountNode = getLastNodeFromPath(accountPath);
    if (accountNode.size == null) return;

    const getSizeFunction = nameApi.accountGetSizeFunction(accountNode.name);
    return fragment`export function ${getSizeFunction}(): number {
  return ${accountNode.size};
}`;
}
