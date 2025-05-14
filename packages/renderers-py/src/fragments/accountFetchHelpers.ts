import { AccountNode } from '@codama/nodes';
import { getLastNodeFromPath, NodePath } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, fragment, fragmentFromTemplate } from './common';

export function getAccountFetchHelpersFragment(
    scope: Pick<GlobalFragmentScope, 'customAccountData' | 'nameApi'> & {
        accountPath: NodePath<AccountNode>;
        typeManifest: TypeManifest;
    },
): Fragment {
    const { accountPath, typeManifest, nameApi, customAccountData } = scope;
    const accountNode = getLastNodeFromPath(accountPath);
    const hasCustomData = customAccountData.has(accountNode.name);
    const accountTypeFragment = hasCustomData
        ? typeManifest.strictType.clone()
        : fragment(nameApi.dataType(accountNode.name));
    const decoderFunctionFragment = hasCustomData
        ? typeManifest.decoder.clone()
        : fragment(`${nameApi.decoderFunction(accountNode.name)}()`);

    return fragmentFromTemplate('accountFetchHelpers.njk', {
        accountType: accountTypeFragment.render,
        decodeFunction: nameApi.accountDecodeFunction(accountNode.name),
        decoderFunction: decoderFunctionFragment.render,
        fetchAllFunction: nameApi.accountFetchAllFunction(accountNode.name),
        fetchAllMaybeFunction: nameApi.accountFetchAllMaybeFunction(accountNode.name),
        fetchFunction: nameApi.accountFetchFunction(accountNode.name),
        fetchMaybeFunction: nameApi.accountFetchMaybeFunction(accountNode.name),
    })
        .mergeImportsWith(accountTypeFragment, decoderFunctionFragment)
        .addImports('solanaAddresses', ['type Address'])
        .addImports('solanaAccounts', [
            'type Account',
            'assertAccountExists',
            'assertAccountsExist',
            'decodeAccount',
            'type EncodedAccount',
            'fetchEncodedAccount',
            'fetchEncodedAccounts',
            'type FetchAccountConfig',
            'type FetchAccountsConfig',
            'type MaybeAccount',
            'type MaybeEncodedAccount',
        ]);
}
