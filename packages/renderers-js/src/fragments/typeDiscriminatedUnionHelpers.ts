import { isDataEnum, isNode, TypeNode } from '@codama/nodes';
import { pipe } from '@codama/visitors-core';

import { addFragmentImports, Fragment, fragmentFromTemplate, RenderScope } from '../utils';

export function getTypeDiscriminatedUnionHelpersFragment(
    scope: Pick<RenderScope, 'nameApi'> & {
        name: string;
        typeNode: TypeNode;
    },
): Fragment | undefined {
    const { name, typeNode, nameApi } = scope;
    const isDiscriminatedUnion = isNode(typeNode, 'enumTypeNode') && isDataEnum(typeNode);
    if (!isDiscriminatedUnion) return;

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
