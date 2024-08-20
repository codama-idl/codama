import { assertIsNode, camelCase, InstructionByteDeltaNode, InstructionNode, isNode } from '@kinobi-so/nodes';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { Fragment, fragment, mergeFragments } from './common';

export function getInstructionByteDeltaFragment(
    scope: Pick<GlobalFragmentScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi'> & {
        instructionNode: InstructionNode;
        useAsync: boolean;
    },
): Fragment {
    const { byteDeltas } = scope.instructionNode;
    const fragments = (byteDeltas ?? []).flatMap(r => getByteDeltaFragment(r, scope));
    if (fragments.length === 0) return fragment('');
    return mergeFragments(
        fragments,
        r =>
            `// Bytes created or reallocated by the instruction.\n` +
            `const byteDelta: number = [${r.join(',')}].reduce((a, b) => a + b, 0);`,
    );
}

function getByteDeltaFragment(
    byteDelta: InstructionByteDeltaNode,
    scope: Pick<GlobalFragmentScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi'> & {
        useAsync: boolean;
    },
): Fragment[] {
    const bytesFragment = ((): Fragment | null => {
        if (isNode(byteDelta.value, 'numberValueNode')) {
            return getNumberValueNodeFragment(byteDelta);
        }
        if (isNode(byteDelta.value, 'argumentValueNode')) {
            return getArgumentValueNodeFragment(byteDelta);
        }
        if (isNode(byteDelta.value, 'accountLinkNode')) {
            return getAccountLinkNodeFragment(byteDelta, scope);
        }
        if (isNode(byteDelta.value, 'resolverValueNode')) {
            return getResolverValueNodeFragment(byteDelta, scope);
        }
        return null;
    })();

    if (bytesFragment === null) return [];

    if (byteDelta.withHeader) {
        bytesFragment.mapRender(r => `${r} + BASE_ACCOUNT_SIZE`).addImports('solanaAccounts', 'BASE_ACCOUNT_SIZE');
    }

    if (byteDelta.subtract) {
        bytesFragment.mapRender(r => `- (${r})`);
    }

    return [bytesFragment];
}

function getNumberValueNodeFragment(byteDelta: InstructionByteDeltaNode): Fragment {
    assertIsNode(byteDelta.value, 'numberValueNode');
    return fragment(byteDelta.value.number.toString());
}

function getArgumentValueNodeFragment(byteDelta: InstructionByteDeltaNode): Fragment {
    assertIsNode(byteDelta.value, 'argumentValueNode');
    const argumentName = camelCase(byteDelta.value.name);
    return fragment(`Number(args.${argumentName})`);
}

function getAccountLinkNodeFragment(
    byteDelta: InstructionByteDeltaNode,
    scope: Pick<GlobalFragmentScope, 'getImportFrom' | 'nameApi'>,
): Fragment {
    assertIsNode(byteDelta.value, 'accountLinkNode');
    const functionName = scope.nameApi.accountGetSizeFunction(byteDelta.value.name);
    return fragment(`${functionName}()`).addImports(scope.getImportFrom(byteDelta.value), functionName);
}

function getResolverValueNodeFragment(
    byteDelta: InstructionByteDeltaNode,
    scope: Pick<GlobalFragmentScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi'> & {
        useAsync: boolean;
    },
): Fragment | null {
    assertIsNode(byteDelta.value, 'resolverValueNode');
    const isAsync = scope.asyncResolvers.includes(byteDelta.value.name);
    if (!scope.useAsync && isAsync) return null;

    const awaitKeyword = scope.useAsync && isAsync ? 'await ' : '';
    const functionName = scope.nameApi.resolverFunction(byteDelta.value.name);
    return fragment(`${awaitKeyword}${functionName}(resolverScope)`)
        .addImports(scope.getImportFrom(byteDelta.value), functionName)
        .addFeatures(['instruction:resolverScopeVariable']);
}
