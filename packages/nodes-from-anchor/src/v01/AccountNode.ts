import { KINOBI_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND, KinobiError } from '@kinobi-so/errors';
import {
    AccountNode,
    accountNode,
    bytesTypeNode,
    camelCase,
    fieldDiscriminatorNode,
    structFieldTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';

import { getAnchorDiscriminatorV01 } from './../discriminators';
import { IdlV01Account, IdlV01TypeDef, IdlV01TypeDefTyStruct } from './idl';
import { structTypeNodeFromAnchorV01 } from './typeNodes';

export function accountNodeFromAnchorV01(idl: IdlV01Account, types: IdlV01TypeDef[]): AccountNode {
    const idlName = idl.name;
    const name = camelCase(idlName);

    const type = types.find(t => t.name === idl.name);

    if (!type) {
        throw new KinobiError(KINOBI_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND, {});
    }

    if (type.type.kind !== 'struct') {
        throw new KinobiError(KINOBI_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND, {});
    }

    const idlTypeStruct = type.type as IdlV01TypeDefTyStruct;

    const data = structTypeNodeFromAnchorV01(idlTypeStruct);

    const discriminator = structFieldTypeNode({
        defaultValue: getAnchorDiscriminatorV01(idl.discriminator),
        defaultValueStrategy: 'omitted',
        name: 'discriminator',
        type: bytesTypeNode(),
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
