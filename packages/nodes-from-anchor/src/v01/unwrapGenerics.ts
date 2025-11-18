import { CODAMA_ERROR__ANCHOR__GENERIC_TYPE_MISSING, CodamaError } from '@codama/errors';
import { TypeNode } from '@codama/nodes';

import {
    IdlV01GenericArgConst,
    IdlV01GenericArgType,
    IdlV01TypeDef,
    IdlV01TypeDefGenericConst,
    IdlV01TypeDefGenericType,
    IdlV01TypeDefined,
} from './idl';
import { typeNodeFromAnchorV01 } from './typeNodes';

export type GenericsV01 = {
    constArgs: Record<string, IdlV01GenericArgConst & IdlV01TypeDefGenericConst>;
    typeArgs: Record<string, IdlV01GenericArgType & IdlV01TypeDefGenericType>;
    types: Record<string, IdlV01TypeDef & Required<Pick<IdlV01TypeDef, 'generics'>>>;
};

export function extractGenerics(types: IdlV01TypeDef[]): [IdlV01TypeDef[], GenericsV01] {
    const [nonGenericTypes, genericTypes] = types.reduce(
        (acc, type) => {
            acc['generics' in type ? 1 : 0].push(type);
            return acc;
        },
        [[], []] as [IdlV01TypeDef[], IdlV01TypeDef[]],
    );

    const generics = {
        constArgs: {},
        typeArgs: {},
        types: Object.fromEntries(genericTypes.map(type => [type.name, type])),
    } as GenericsV01;

    return [nonGenericTypes, generics];
}

export function unwrapGenericTypeFromAnchorV01(type: IdlV01TypeDefined, generics: GenericsV01): TypeNode {
    const genericType = generics.types[type.defined.name];
    if (!genericType) {
        throw new CodamaError(CODAMA_ERROR__ANCHOR__GENERIC_TYPE_MISSING, { name: type.defined.name });
    }

    const constArgs: GenericsV01['constArgs'] = {};
    const typeArgs: GenericsV01['typeArgs'] = {};

    const genericDefinitions = genericType.generics ?? [];
    const genericArgs = type.defined.generics ?? [];
    genericDefinitions.forEach((genericDefinition, index) => {
        const genericArg = genericArgs[index];
        if (genericDefinition.kind === 'const') {
            constArgs[genericDefinition.name] = genericArg as IdlV01GenericArgConst & IdlV01TypeDefGenericConst;
        } else {
            typeArgs[genericDefinition.name] = genericArg as IdlV01GenericArgType & IdlV01TypeDefGenericType;
        }
    });

    return typeNodeFromAnchorV01(genericType.type, {
        ...generics,
        constArgs: { ...generics.constArgs, ...constArgs },
        typeArgs: { ...generics.typeArgs, ...typeArgs },
    });
}
