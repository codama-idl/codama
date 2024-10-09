import {
    assertIsNode,
    camelCase,
    getAllInstructionArguments,
    InstructionNode,
    InstructionRemainingAccountsNode,
    isNode,
} from '@codama/nodes';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { Fragment, fragment, mergeFragments } from './common';

export function getInstructionRemainingAccountsFragment(
    scope: Pick<GlobalFragmentScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi'> & {
        instructionNode: InstructionNode;
        useAsync: boolean;
    },
): Fragment {
    const { remainingAccounts } = scope.instructionNode;
    const fragments = (remainingAccounts ?? []).flatMap(r => getRemainingAccountsFragment(r, scope));
    if (fragments.length === 0) return fragment('');
    return mergeFragments(
        fragments,
        r =>
            `// Remaining accounts.\n` +
            `const remainingAccounts: IAccountMeta[] = ${r.length === 1 ? r[0] : `[...${r.join(', ...')}]`}`,
    ).addImports('solanaInstructions', ['type IAccountMeta']);
}

function getRemainingAccountsFragment(
    remainingAccounts: InstructionRemainingAccountsNode,
    scope: Pick<GlobalFragmentScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi'> & {
        instructionNode: InstructionNode;
        useAsync: boolean;
    },
): Fragment[] {
    const remainingAccountsFragment = ((): Fragment | null => {
        if (isNode(remainingAccounts.value, 'argumentValueNode')) {
            return getArgumentValueNodeFragment(remainingAccounts, scope);
        }
        if (isNode(remainingAccounts.value, 'resolverValueNode')) {
            return getResolverValueNodeFragment(remainingAccounts, scope);
        }
        return null;
    })();

    if (remainingAccountsFragment === null) return [];
    return [remainingAccountsFragment];
}

function getArgumentValueNodeFragment(
    remainingAccounts: InstructionRemainingAccountsNode,
    scope: { instructionNode: InstructionNode },
): Fragment {
    const { instructionNode } = scope;
    assertIsNode(remainingAccounts.value, 'argumentValueNode');
    const argumentName = camelCase(remainingAccounts.value.name);
    const isOptional = remainingAccounts.isOptional ?? false;
    const isSigner = remainingAccounts.isSigner ?? false;
    const isWritable = remainingAccounts.isWritable ?? false;
    const nonSignerRole = isWritable ? 'AccountRole.WRITABLE' : 'AccountRole.READONLY';
    const signerRole = isWritable ? 'AccountRole.WRITABLE_SIGNER' : 'AccountRole.READONLY_SIGNER';
    const role = isSigner === true ? signerRole : nonSignerRole;
    const argumentArray = isOptional ? `(args.${argumentName} ?? [])` : `args.${argumentName}`;

    // The argument already exists or was added as `Array<Address>`.
    const allArguments = getAllInstructionArguments(instructionNode);
    const argumentExists = allArguments.some(arg => arg.name === remainingAccounts.value.name);
    if (argumentExists || isSigner === false) {
        return fragment(`${argumentArray}.map((address) => ({ address, role: ${role} }))`).addImports(
            'solanaInstructions',
            ['AccountRole'],
        );
    }

    // The argument was added as `Array<TransactionSigner | Address>`.
    if (isSigner === 'either') {
        return fragment(
            `${argumentArray}.map((addressOrSigner) => (` +
                `isTransactionSigner(addressOrSigner)\n` +
                `? { address: addressOrSigner.address, role: ${role}, signer: addressOrSigner }\n` +
                `: { address: addressOrSigner, role: ${role} }\n` +
                `))`,
        )
            .addImports('solanaInstructions', ['AccountRole'])
            .addImports('shared', ['isTransactionSigner']);
    }

    // The argument was added as `Array<TransactionSigner>`.
    return fragment(
        `${argumentArray}.map((signer) => ({ address: signer.address, role: ${signerRole}, signer }))`,
    ).addImports('solanaInstructions', ['AccountRole']);
}

function getResolverValueNodeFragment(
    remainingAccounts: InstructionRemainingAccountsNode,
    scope: Pick<GlobalFragmentScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi'> & {
        useAsync: boolean;
    },
): Fragment | null {
    assertIsNode(remainingAccounts.value, 'resolverValueNode');
    const isAsync = scope.asyncResolvers.includes(remainingAccounts.value.name);
    if (!scope.useAsync && isAsync) return null;

    const awaitKeyword = scope.useAsync && isAsync ? 'await ' : '';
    const functionName = scope.nameApi.resolverFunction(remainingAccounts.value.name);
    return fragment(`${awaitKeyword}${functionName}(resolverScope)`)
        .addImports(scope.getImportFrom(remainingAccounts.value), functionName)
        .addFeatures(['instruction:resolverScopeVariable']);
}
