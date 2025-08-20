import { AccountNode, isNodeFilter } from '@codama/nodes';
import { findProgramNodeFromPath, getLastNodeFromPath, NodePath, pipe } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import type { TypeManifest } from '../TypeManifest';
import { addFragmentImports, Fragment, fragment, fragmentFromTemplate, mergeFragmentImports } from '../utils';

export function getAccountPdaHelpersFragment(
    scope: Pick<GlobalFragmentScope, 'customAccountData' | 'linkables' | 'nameApi'> & {
        accountPath: NodePath<AccountNode>;
        typeManifest: TypeManifest;
    },
): Fragment {
    const { accountPath, nameApi, linkables, customAccountData, typeManifest } = scope;
    const accountNode = getLastNodeFromPath(accountPath);
    const programNode = findProgramNodeFromPath(accountPath)!;
    const pdaNode = accountNode.pda ? linkables.get([...accountPath, accountNode.pda]) : undefined;
    if (!pdaNode) {
        return fragment('');
    }

    const accountTypeFragment = customAccountData.has(accountNode.name)
        ? typeManifest.strictType
        : fragment(nameApi.dataType(accountNode.name));

    // Here we cannot use the `getImportFrom` function because
    // we need to know the seeds of the PDA in order to know
    // if we need to render a `seeds` argument or not.
    const importFrom = 'generatedPdas';
    const pdaSeedsType = nameApi.pdaSeedsType(pdaNode.name);
    const findPdaFunction = nameApi.pdaFindFunction(pdaNode.name);
    const hasVariableSeeds = pdaNode.seeds.filter(isNodeFilter('variablePdaSeedNode')).length > 0;

    return pipe(
        fragmentFromTemplate('accountPdaHelpers.njk', {
            accountType: accountTypeFragment.content,
            fetchFromSeedsFunction: nameApi.accountFetchFromSeedsFunction(accountNode.name),
            fetchFunction: nameApi.accountFetchFunction(accountNode.name),
            fetchMaybeFromSeedsFunction: nameApi.accountFetchMaybeFromSeedsFunction(accountNode.name),
            fetchMaybeFunction: nameApi.accountFetchMaybeFunction(accountNode.name),
            findPdaFunction,
            hasVariableSeeds,
            pdaSeedsType,
            program: programNode,
        }),
        f => mergeFragmentImports(f, [accountTypeFragment.imports]),
        f => addFragmentImports(f, importFrom, hasVariableSeeds ? [pdaSeedsType, findPdaFunction] : [findPdaFunction]),
        f => addFragmentImports(f, 'solanaAddresses', ['type Address']),
        f =>
            addFragmentImports(f, 'solanaAccounts', [
                'type Account',
                'assertAccountExists',
                'type FetchAccountConfig',
                'type MaybeAccount',
            ]),
    );
}
