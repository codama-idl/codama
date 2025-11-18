import { CODAMA_ERROR__ANCHOR__ACCOUNT_TYPE_MISSING, CodamaError } from '@codama/errors';
import {
    AccountNode,
    accountNode,
    assertIsNode,
    bytesTypeNode,
    camelCase,
    fieldDiscriminatorNode,
    fixedSizeTypeNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';

import { getAnchorDiscriminatorV01 } from './../discriminators';
import type { IdlV01Account, IdlV01TypeDef } from './idl';
import { typeNodeFromAnchorV01 } from './typeNodes';
import type { GenericsV01 } from './unwrapGenerics';

export function accountNodeFromAnchorV01(
    idl: IdlV01Account,
    types: IdlV01TypeDef[],
    generics: GenericsV01,
): AccountNode {
    const name = camelCase(idl.name);
    const type = types.find(({ name }) => name === idl.name);

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

    return accountNode({
        data: structTypeNode([discriminator, ...data.fields]),
        discriminators: [fieldDiscriminatorNode('discriminator')],
        name,
    });
}
