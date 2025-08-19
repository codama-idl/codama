import { AccountNode } from '@codama/nodes';
import { getLastNodeFromPath, NodePath, pipe } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { addFragmentImports, Fragment, fragment, fragmentFromTemplate, mergeFragmentImports } from '../utils';

export function getAccountFetchHelpersFragment(
    scope: Pick<GlobalFragmentScope, 'customAccountData' | 'nameApi'> & {
        accountPath: NodePath<AccountNode>;
        typeManifest: TypeManifest;
    },
): Fragment {
    const { accountPath, typeManifest, nameApi, customAccountData } = scope;
    const accountNode = getLastNodeFromPath(accountPath);
    const hasCustomData = customAccountData.has(accountNode.name);
    const accountTypeFragment = hasCustomData ? typeManifest.strictType : fragment(nameApi.dataType(accountNode.name));
    const decoderFunctionFragment = hasCustomData
        ? typeManifest.decoder
        : fragment(`${nameApi.decoderFunction(accountNode.name)}()`);

    return pipe(
        fragmentFromTemplate('accountFetchHelpers.njk', {
            accountType: accountTypeFragment.content,
            decodeFunction: nameApi.accountDecodeFunction(accountNode.name),
            decoderFunction: decoderFunctionFragment.content,
            fetchAllFunction: nameApi.accountFetchAllFunction(accountNode.name),
            fetchAllMaybeFunction: nameApi.accountFetchAllMaybeFunction(accountNode.name),
            fetchFunction: nameApi.accountFetchFunction(accountNode.name),
            fetchMaybeFunction: nameApi.accountFetchMaybeFunction(accountNode.name),
        }),
        f => mergeFragmentImports(f, [accountTypeFragment.imports, decoderFunctionFragment.imports]),
        f => addFragmentImports(f, 'solanaAddresses', ['type Address']),
        f =>
            addFragmentImports(f, 'solanaAccounts', [
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
            ]),
    );
}
