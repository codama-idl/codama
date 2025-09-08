import { AccountNode, resolveNestedTypeNode } from '@codama/nodes';
import { findProgramNodeFromPath, getLastNodeFromPath, NodePath, visit } from '@codama/visitors-core';

import { Fragment, mergeFragments, RenderScope } from '../utils';
import { getAccountFetchHelpersFragment } from './accountFetchHelpers';
import { getAccountPdaHelpersFragment } from './accountPdaHelpers';
import { getAccountSizeHelpersFragment } from './accountSizeHelpers';
import { getAccountTypeFragment } from './accountType';
import { getDiscriminatorConstantsFragment } from './discriminatorConstants';

export function getAccountPageFragment(
    scope: Pick<RenderScope, 'customAccountData' | 'linkables' | 'nameApi' | 'typeManifestVisitor'> & {
        accountPath: NodePath<AccountNode>;
        size: number | null;
    },
): Fragment {
    const node = getLastNodeFromPath(scope.accountPath);
    if (!findProgramNodeFromPath(scope.accountPath)) {
        throw new Error('Account must be visited inside a program.');
    }

    const typeManifest = visit(node, scope.typeManifestVisitor);
    const fields = resolveNestedTypeNode(node.data).fields;
    return mergeFragments(
        [
            getDiscriminatorConstantsFragment({
                ...scope,
                discriminatorNodes: node.discriminators ?? [],
                fields,
                prefix: node.name,
            }),
            getAccountTypeFragment({ ...scope, typeManifest }),
            getAccountFetchHelpersFragment({ ...scope, typeManifest }),
            getAccountSizeHelpersFragment(scope),
            getAccountPdaHelpersFragment({ ...scope, typeManifest }),
        ],
        cs => cs.join('\n\n'),
    );
}
