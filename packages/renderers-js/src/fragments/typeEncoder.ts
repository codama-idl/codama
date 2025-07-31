import { isDataEnum, isNode, TypeNode } from '@codama/nodes';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, fragmentFromTemplate } from './common';

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

    return fragmentFromTemplate('typeEncoder.njk', {
        docs,
        encoderFunction: nameApi.encoderFunction(name),
        encoderType,
        looseName: nameApi.dataArgsType(name),
        manifest,
        strictName: nameApi.dataType(name),
        useTypeCast,
    })
        .mergeImportsWith(manifest.encoder)
        .addImports('solanaCodecsCore', `type ${encoderType}`);
}
