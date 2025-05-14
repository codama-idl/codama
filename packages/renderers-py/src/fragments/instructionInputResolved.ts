import { camelCase, InstructionNode, isNode, parseOptionalAccountStrategy } from '@codama/nodes';
import { getLastNodeFromPath, NodePath, ResolvedInstructionInput } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { Fragment, fragment, mergeFragments } from './common';
import { getInstructionInputDefaultFragment } from './instructionInputDefault';

export function getInstructionInputResolvedFragment(
    scope: Pick<GlobalFragmentScope, 'asyncResolvers' | 'getImportFrom' | 'nameApi' | 'typeManifestVisitor'> & {
        instructionPath: NodePath<InstructionNode>;
        resolvedInputs: ResolvedInstructionInput[];
        useAsync: boolean;
    },
): Fragment {
    const instructionNode = getLastNodeFromPath(scope.instructionPath);
    const resolvedInputFragments = scope.resolvedInputs.flatMap((input: ResolvedInstructionInput): Fragment[] => {
        const inputFragment = getInstructionInputDefaultFragment({
            ...scope,
            input,
            optionalAccountStrategy: parseOptionalAccountStrategy(instructionNode.optionalAccountStrategy),
        });
        if (!inputFragment.render) return [];
        const camelName = camelCase(input.name);
        return [
            inputFragment.mapRender(r =>
                isNode(input, 'instructionArgumentNode')
                    ? `if (!args.${camelName}) {\n${r}\n}`
                    : `if (!accounts.${camelName}.value) {\n${r}\n}`,
            ),
        ];
    });

    if (resolvedInputFragments.length === 0) {
        return fragment('');
    }

    return mergeFragments([fragment('// Resolve default values.'), ...resolvedInputFragments], renders =>
        renders.join('\n'),
    );
}
