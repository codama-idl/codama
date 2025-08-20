import { ProgramNode, resolveNestedTypeNode } from '@codama/nodes';
import { mapFragmentContent } from '@codama/renderers-core';
import { pipe } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { addFragmentImports, Fragment, fragment, mergeFragments } from '../utils';
import { getDiscriminatorConditionFragment } from './discriminatorCondition';

export function getProgramAccountsFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi' | 'typeManifestVisitor'> & {
        programNode: ProgramNode;
    },
): Fragment {
    if (scope.programNode.accounts.length === 0) return fragment('');
    return mergeFragments(
        [getProgramAccountsEnumFragment(scope), getProgramAccountsIdentifierFunctionFragment(scope)],
        c => `${c.join('\n\n')}\n`,
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

    return pipe(
        mergeFragments(
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
            c => c.join('\n'),
        ),
        f =>
            mapFragmentContent(
                f,
                discriminators =>
                    `export function ${programAccountsIdentifierFunction}(` +
                    `account: { data: ReadonlyUint8Array } | ReadonlyUint8Array` +
                    `): ${programAccountsEnum} {\n` +
                    `const data = 'data' in account ? account.data : account;\n` +
                    `${discriminators}\n` +
                    `throw new Error("The provided account could not be identified as a ${programNode.name} account.")\n` +
                    `}`,
            ),
        f => addFragmentImports(f, 'solanaCodecsCore', ['type ReadonlyUint8Array']),
    );
}
