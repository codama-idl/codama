import { isDataEnum, isNode, TypeNode } from '@codama/nodes';

import { Fragment, fragment, getDocblockFragment, RenderScope, TypeManifest, use } from '../utils';

export function getTypeEncoderFragment(
    scope: Pick<RenderScope, 'nameApi'> & {
        docs?: string[];
        manifest: Pick<TypeManifest, 'encoder'>;
        name: string;
        node: TypeNode;
        size: number | null;
    },
): Fragment {
    const { name, node, manifest, nameApi, docs = [] } = scope;
    const encoderFunction = nameApi.encoderFunction(name);
    const looseName = nameApi.dataArgsType(name);

    const docblock = getDocblockFragment(docs, true);
    const encoderType = use(
        typeof scope.size === 'number' ? 'type FixedSizeEncoder' : 'type Encoder',
        'solanaCodecsCore',
    );
    const useTypeCast = isNode(node, 'enumTypeNode') && isDataEnum(node) && typeof scope.size === 'number';

    const typeCast = useTypeCast ? fragment` as ${encoderType}<${looseName}>` : '';
    return fragment`${docblock}export function ${encoderFunction}(): ${encoderType}<${looseName}> {
    return ${manifest.encoder}${typeCast};
}`;
}
