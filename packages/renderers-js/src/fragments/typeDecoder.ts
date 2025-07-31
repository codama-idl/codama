import { isDataEnum, isNode, TypeNode } from '@codama/nodes';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { TypeManifest } from '../TypeManifest';
import { Fragment, fragmentFromTemplate } from './common';

export function getTypeDecoderFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        docs?: string[];
        manifest: Pick<TypeManifest, 'decoder'>;
        name: string;
        node: TypeNode;
        size: number | null;
    },
): Fragment {
    const { name, node, manifest, nameApi, docs = [] } = scope;
    const decoderType = typeof scope.size === 'number' ? 'FixedSizeDecoder' : 'Decoder';
    const useTypeCast = isNode(node, 'enumTypeNode') && isDataEnum(node) && typeof scope.size === 'number';

    return fragmentFromTemplate('typeDecoder.njk', {
        decoderFunction: nameApi.decoderFunction(name),
        decoderType,
        docs,
        looseName: nameApi.dataArgsType(name),
        manifest,
        strictName: nameApi.dataType(name),
        useTypeCast,
    })
        .mergeImportsWith(manifest.decoder)
        .addImports('solanaCodecsCore', `type ${decoderType}`);
}
