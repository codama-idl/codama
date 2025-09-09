import { isDataEnum, isNode, TypeNode } from '@codama/nodes';

import { Fragment, fragment, mergeFragments, RenderScope, use } from '../utils';

export function getTypeDiscriminatedUnionHelpersFragment(
    scope: Pick<RenderScope, 'nameApi'> & { name: string; typeNode: TypeNode },
): Fragment | undefined {
    const { name, typeNode, nameApi } = scope;
    const isDiscriminatedUnion = isNode(typeNode, 'enumTypeNode') && isDataEnum(typeNode);
    if (!isDiscriminatedUnion) return;

    const functionName = nameApi.discriminatedUnionFunction(name);
    const isDiscriminatedUnionFunctionName = nameApi.isDiscriminatedUnionFunction(name);
    const discriminatorName = nameApi.discriminatedUnionDiscriminator(name);
    const strictName = nameApi.dataType(name);
    const looseName = nameApi.dataArgsType(name);

    const getVariantContentType = use('type GetDiscriminatedUnionVariantContent', 'solanaCodecsDataStructures');
    const getVariantType = use('type GetDiscriminatedUnionVariant', 'solanaCodecsDataStructures');
    const variantSignatures = mergeFragments(
        typeNode.variants.map(variant => {
            const variantName = nameApi.discriminatedUnionVariant(variant.name);
            if (isNode(variant, 'enumStructVariantTypeNode')) {
                return fragment`export function ${functionName}(kind: '${variantName}', data: ${getVariantContentType}<${looseName}, '${discriminatorName}', '${variantName}'>): ${getVariantType}<${looseName}, '${discriminatorName}', '${variantName}'>;`;
            }
            if (isNode(variant, 'enumTupleVariantTypeNode')) {
                return fragment`export function ${functionName}(kind: '${variantName}', data: ${getVariantContentType}<${looseName}, '${discriminatorName}', '${variantName}'>['fields']): ${getVariantType}<${looseName}, '${discriminatorName}', '${variantName}'>;`;
            }
            return fragment`export function ${functionName}(kind: '${variantName}'): ${getVariantType}<${looseName}, '${discriminatorName}', '${variantName}'>;`;
        }),
        cs => (cs.length > 0 ? `${cs.join('\n')}\n` : ''),
    );

    return fragment`// Data Enum Helpers.
${variantSignatures}export function ${functionName}<K extends ${looseName}['${discriminatorName}'], Data>(kind: K, data?: Data) {
  return Array.isArray(data) ? { ${discriminatorName}: kind, fields: data } : { ${discriminatorName}: kind, ...(data ?? {}) };
}

export function ${isDiscriminatedUnionFunctionName}<K extends ${strictName}['${discriminatorName}']>(kind: K, value: ${strictName}): value is ${strictName} & { ${discriminatorName}: K } {
  return value.${discriminatorName} === kind;
};
`;
}
