import { isDataEnum, isNode, TypeNode } from '@codama/nodes';
import { pipe } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { addFragmentImports, Fragment, fragmentFromTemplate, mergeFragmentImports } from '../utils';

export function getTypeEncoderFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        docs?: string[];
        manifest: Pick<TypeManifest, 'encoder'>;
        name: string;
        node: TypeNode;
        size: number | null;
    },
): Fragment {
    const { name, node, manifest, nameApi, docs = [] } = scope;
    const encoderType = typeof scope.size === 'number' ? 'FixedSizeEncoder' : 'Encoder';
    const useTypeCast = isNode(node, 'enumTypeNode') && isDataEnum(node) && typeof scope.size === 'number';

    return pipe(
        fragmentFromTemplate('typeEncoder.njk', {
            docs,
            encoderFunction: nameApi.encoderFunction(name),
            encoderType,
            looseName: nameApi.dataArgsType(name),
            manifest,
            strictName: nameApi.dataType(name),
            useTypeCast,
        }),
        f => mergeFragmentImports(f, [manifest.encoder.imports]),
        f => addFragmentImports(f, 'solanaCodecsCore', [`type ${encoderType}`]),
    );
}
