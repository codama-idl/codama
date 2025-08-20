import { isDataEnum, isNode, TypeNode } from '@codama/nodes';
import { pipe } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { addFragmentImports, Fragment, fragment, fragmentFromTemplate } from '../utils';

export function getTypeDiscriminatedUnionHelpersFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi'> & {
        name: string;
        typeNode: TypeNode;
    },
): Fragment {
    const { name, typeNode, nameApi } = scope;
    const isDiscriminatedUnion = isNode(typeNode, 'enumTypeNode') && isDataEnum(typeNode);

    if (!isDiscriminatedUnion) {
        return fragment('');
    }

    return pipe(
        fragmentFromTemplate('typeDiscriminatedUnionHelpers.njk', {
            discriminatedUnionDiscriminator: nameApi.discriminatedUnionDiscriminator(name),
            discriminatedUnionFunction: nameApi.discriminatedUnionFunction(name),
            getVariant: (variant: string) => nameApi.discriminatedUnionVariant(variant),
            isDiscriminatedUnionFunction: nameApi.isDiscriminatedUnionFunction(name),
            looseName: nameApi.dataArgsType(name),
            strictName: nameApi.dataType(name),
            typeNode,
        }),
        f =>
            addFragmentImports(f, 'solanaCodecsDataStructures', [
                'type GetDiscriminatedUnionVariantContent',
                'type GetDiscriminatedUnionVariant',
            ]),
    );
}
