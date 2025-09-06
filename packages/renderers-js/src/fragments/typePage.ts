import { DefinedTypeNode } from '@codama/nodes';
import { pipe, visit } from '@codama/visitors-core';

import { Fragment, getPageFragment, mergeFragments, removeFragmentImports, RenderScope } from '../utils';
import { getTypeDiscriminatedUnionHelpersFragment } from './typeDiscriminatedUnionHelpers';
import { getTypeWithCodecFragment } from './typeWithCodec';

export function getTypePageFragment(
    scope: Pick<RenderScope, 'dependencyMap' | 'nameApi' | 'typeManifestVisitor' | 'useGranularImports'> & {
        node: DefinedTypeNode;
        size: number | null;
    },
): Fragment {
    const node = scope.node;
    const manifest = visit(node, scope.typeManifestVisitor);
    return pipe(
        mergeFragments(
            [
                getTypeWithCodecFragment({ ...scope, manifest, name: node.name, node: node.type, typeDocs: node.docs }),
                getTypeDiscriminatedUnionHelpersFragment({ ...scope, name: node.name, typeNode: node.type }),
            ],
            cs => cs.join('\n\n'),
        ),
        f =>
            removeFragmentImports(f, 'generatedTypes', [
                scope.nameApi.dataType(node.name),
                scope.nameApi.dataArgsType(node.name),
                scope.nameApi.encoderFunction(node.name),
                scope.nameApi.decoderFunction(node.name),
                scope.nameApi.codecFunction(node.name),
            ]),
        f => getPageFragment(f, { ...scope, dependencyMap: { ...scope.dependencyMap, generatedTypes: '.' } }),
    );
}
