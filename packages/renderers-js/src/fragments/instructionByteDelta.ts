import { assertIsNode, camelCase, InstructionByteDeltaNode, InstructionNode, isNode } from '@codama/nodes';
import { mapFragmentContent } from '@codama/renderers-core';
import { getLastNodeFromPath, NodePath, pipe } from '@codama/visitors-core';

import { addFragmentFeatures, Fragment, fragment, mergeFragments, RenderScope, use } from '../utils';

export function getInstructionByteDeltaFragment(
    scope: Pick<RenderScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi'> & {
        instructionPath: NodePath<InstructionNode>;
        useAsync: boolean;
    },
): Fragment | undefined {
    const { byteDeltas } = getLastNodeFromPath(scope.instructionPath);
    const fragments = (byteDeltas ?? []).flatMap(c => getByteDeltaFragment(c, scope));
    if (fragments.length === 0) return;
    return mergeFragments(
        fragments,
        c =>
            `// Bytes created or reallocated by the instruction.\n` +
            `const byteDelta: number = [${c.join(',')}].reduce((a, b) => a + b, 0);`,
    );
}

function getByteDeltaFragment(
    byteDelta: InstructionByteDeltaNode,
    scope: Pick<RenderScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi'> & {
        useAsync: boolean;
    },
): Fragment[] {
    let bytesFragment = ((): Fragment | null => {
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
        bytesFragment = fragment`${bytesFragment} + ${use('BASE_ACCOUNT_SIZE', 'solanaAccounts')}`;
    }

    if (byteDelta.subtract) {
        bytesFragment = pipe(bytesFragment, f => mapFragmentContent(f, c => `- (${c})`));
    }

    return [bytesFragment];
}

function getNumberValueNodeFragment(byteDelta: InstructionByteDeltaNode): Fragment {
    assertIsNode(byteDelta.value, 'numberValueNode');
    return fragment`${byteDelta.value.number}`;
}

function getArgumentValueNodeFragment(byteDelta: InstructionByteDeltaNode): Fragment {
    assertIsNode(byteDelta.value, 'argumentValueNode');
    const argumentName = camelCase(byteDelta.value.name);
    return fragment`Number(args.${argumentName})`;
}

function getAccountLinkNodeFragment(
    byteDelta: InstructionByteDeltaNode,
    scope: Pick<RenderScope, 'getImportFrom' | 'nameApi'>,
): Fragment {
    assertIsNode(byteDelta.value, 'accountLinkNode');
    const functionName = use(
        scope.nameApi.accountGetSizeFunction(byteDelta.value.name),
        scope.getImportFrom(byteDelta.value),
    );
    return fragment`${functionName}()`;
}

function getResolverValueNodeFragment(
    byteDelta: InstructionByteDeltaNode,
    scope: Pick<RenderScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi'> & {
        useAsync: boolean;
    },
): Fragment | null {
    assertIsNode(byteDelta.value, 'resolverValueNode');
    const isAsync = scope.asyncResolvers.includes(byteDelta.value.name);
    if (!scope.useAsync && isAsync) return null;

    const awaitKeyword = scope.useAsync && isAsync ? 'await ' : '';
    const functionName = use(
        scope.nameApi.resolverFunction(byteDelta.value.name),
        scope.getImportFrom(byteDelta.value),
    );
    return pipe(fragment`${awaitKeyword}${functionName}(resolverScope)`, f =>
        addFragmentFeatures(f, ['instruction:resolverScopeVariable']),
    );
}
