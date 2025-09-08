import { isDataEnum, isNode, TypeNode } from '@codama/nodes';

import { Fragment, fragment, getDocblockFragment, RenderScope, TypeManifest, use } from '../utils';

export function getTypeDecoderFragment(
    scope: Pick<RenderScope, 'nameApi'> & {
        docs?: string[];
        manifest: Pick<TypeManifest, 'decoder'>;
        name: string;
        node: TypeNode;
        size: number | null;
    },
): Fragment {
    const { name, node, manifest, nameApi, docs = [] } = scope;
    const decoderFunction = nameApi.decoderFunction(name);
    const strictName = nameApi.dataType(name);

    const docblock = getDocblockFragment(docs, true);
    const decoderType = use(
        typeof scope.size === 'number' ? 'type FixedSizeDecoder' : 'type Decoder',
        'solanaCodecsCore',
    );
    const useTypeCast = isNode(node, 'enumTypeNode') && isDataEnum(node) && typeof scope.size === 'number';

    const typeCast = useTypeCast ? fragment` as ${decoderType}<${strictName}>` : '';
    return fragment`${docblock}export function ${decoderFunction}(): ${decoderType}<${strictName}> {
    return ${manifest.decoder}${typeCast};
}`;
}
