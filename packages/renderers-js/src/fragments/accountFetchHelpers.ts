import { AccountNode } from '@kinobi-so/nodes';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, fragment, fragmentFromTemplate } from './common';

export function getAccountFetchHelpersFragment(
    scope: Pick<GlobalFragmentScope, 'customAccountData' | 'nameApi'> & {
        accountNode: AccountNode;
        typeManifest: TypeManifest;
    },
): Fragment {
    const { accountNode, typeManifest, nameApi, customAccountData } = scope;
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
        .addImports('solanaAddresses', ['Address'])
        .addImports('solanaAccounts', [
            'Account',
            'assertAccountExists',
            'assertAccountsExist',
            'decodeAccount',
            'EncodedAccount',
            'fetchEncodedAccount',
            'fetchEncodedAccounts',
            'FetchAccountConfig',
            'FetchAccountsConfig',
            'MaybeAccount',
            'MaybeEncodedAccount',
        ]);
}
