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
import { IdlV01Account } from './idl';

export function accountNodeFromAnchorV01(idl: IdlV01Account): AccountNode {
    const idlName = idl.name;
    const name = camelCase(idlName);

    const discriminator = structFieldTypeNode({
        defaultValue: getAnchorDiscriminatorV01(idl.discriminator),
        defaultValueStrategy: 'omitted',
        name: 'discriminator',
        type: bytesTypeNode(),
    });

    // TODO: How to set defined type link to the field definition in types list?
    return accountNode({
        data: structTypeNode([discriminator]),
        discriminators: [fieldDiscriminatorNode('discriminator')],
        name,
    });
}
