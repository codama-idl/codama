import { CODAMA_ERROR__ANCHOR__ACCOUNT_TYPE_MISSING, KinobiError } from '@codama/errors';
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
import { IdlV01Account, IdlV01TypeDef } from './idl';
import { typeNodeFromAnchorV01 } from './typeNodes';

export function accountNodeFromAnchorV01(idl: IdlV01Account, types: IdlV01TypeDef[]): AccountNode {
    const name = camelCase(idl.name);
    const type = types.find(({ name }) => name === idl.name);

    if (!type) {
        throw new KinobiError(CODAMA_ERROR__ANCHOR__ACCOUNT_TYPE_MISSING, { name: idl.name });
    }

    const data = typeNodeFromAnchorV01(type.type);
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

export function accountNodeFromAnchorV01WithTypeDefinition(types: IdlV01TypeDef[]) {
    return function (idl: IdlV01Account): AccountNode {
        return accountNodeFromAnchorV01(idl, types);
    };
}
