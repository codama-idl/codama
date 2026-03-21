import { CODAMA_ERROR__ANCHOR__ACCOUNT_TYPE_MISSING, CodamaError } from '@codama/errors';
import {
    assertIsNode,
    bytesTypeNode,
    camelCase,
    EventNode,
    eventNode,
    fieldDiscriminatorNode,
    fixedSizeTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';

import { getAnchorDiscriminatorV01 } from './../discriminators';
import type { IdlV01Event, IdlV01TypeDef } from './idl';
import { typeNodeFromAnchorV01 } from './typeNodes';
import type { GenericsV01 } from './unwrapGenerics';

export function eventNodeFromAnchorV01(idl: IdlV01Event, types: IdlV01TypeDef[], generics: GenericsV01): EventNode {
    const name = camelCase(idl.name);
    const type = types.find(candidate => candidate.name === idl.name);

    if (!type) {
        throw new CodamaError(CODAMA_ERROR__ANCHOR__ACCOUNT_TYPE_MISSING, { name: idl.name });
    }

    const data = typeNodeFromAnchorV01(type.type, generics);
    assertIsNode(data, 'structTypeNode');

    const discriminator = structFieldTypeNode({
        defaultValue: getAnchorDiscriminatorV01(idl.discriminator),
        defaultValueStrategy: 'omitted',
        name: 'discriminator',
        type: fixedSizeTypeNode(bytesTypeNode(), idl.discriminator.length),
    });

    return eventNode({
        data: structTypeNode([discriminator, ...data.fields]),
        discriminators: [fieldDiscriminatorNode('discriminator')],
        name,
    });
}

export function eventNodeFromAnchorV01WithTypeDefinition(types: IdlV01TypeDef[], generics: GenericsV01) {
    return function (idl: IdlV01Event): EventNode {
        return eventNodeFromAnchorV01(idl, types, generics);
    };
}
