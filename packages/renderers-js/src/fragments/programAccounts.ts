import { ProgramNode, resolveNestedTypeNode } from '@kinobi-so/nodes';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { Fragment, fragment, mergeFragments } from './common';
import { getDiscriminatorConditionFragment } from './discriminatorCondition';

export function getProgramAccountsFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi' | 'typeManifestVisitor'> & {
        programNode: ProgramNode;
    },
): Fragment {
    if (scope.programNode.accounts.length === 0) return fragment('');
    return mergeFragments(
        [getProgramAccountsEnumFragment(scope), getProgramAccountsIdentifierFunctionFragment(scope)],
        r => `${r.join('\n\n')}\n`,
    );
}

function getProgramAccountsEnumFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        programNode: ProgramNode;
    },
): Fragment {
    const { programNode, nameApi } = scope;
    const programAccountsEnum = nameApi.programAccountsEnum(programNode.name);
    const programAccountsEnumVariants = programNode.accounts.map(account =>
        nameApi.programAccountsEnumVariant(account.name),
    );
    return fragment(`export enum ${programAccountsEnum} { ` + `${programAccountsEnumVariants.join(', ')}` + ` }`);
}

function getProgramAccountsIdentifierFunctionFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi' | 'typeManifestVisitor'> & {
        programNode: ProgramNode;
    },
): Fragment {
    const { programNode, nameApi } = scope;
    const accountsWithDiscriminators = programNode.accounts.filter(
        account => (account.discriminators ?? []).length > 0,
    );
    const hasAccountDiscriminators = accountsWithDiscriminators.length > 0;
    if (!hasAccountDiscriminators) return fragment('');

    const programAccountsEnum = nameApi.programAccountsEnum(programNode.name);
    const programAccountsIdentifierFunction = nameApi.programAccountsIdentifierFunction(programNode.name);
    const discriminatorsFragment = mergeFragments(
        accountsWithDiscriminators.map((account): Fragment => {
            const variant = nameApi.programAccountsEnumVariant(account.name);
            return getDiscriminatorConditionFragment({
                ...scope,
                dataName: 'data',
                discriminators: account.discriminators ?? [],
                ifTrue: `return ${programAccountsEnum}.${variant};`,
                struct: resolveNestedTypeNode(account.data),
            });
        }),
        r => r.join('\n'),
    );

    return discriminatorsFragment.mapRender(
        discriminators =>
            `export function ${programAccountsIdentifierFunction}(` +
            `account: { data: Uint8Array } | Uint8Array` +
            `): ${programAccountsEnum} {\n` +
            `const data = account instanceof Uint8Array ? account : account.data;\n` +
            `${discriminators}\n` +
            `throw new Error("The provided account could not be identified as a ${programNode.name} account.")\n` +
            `}`,
    );
}
