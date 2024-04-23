import {
    AccountNode,
    accountNode,
    assertIsNode,
    bytesTypeNode,
    camelCase,
    DiscriminatorNode,
    fieldDiscriminatorNode,
    pdaLinkNode,
    structFieldTypeNode,
    StructTypeNode,
    structTypeNode,
} from '@kinobi-so/nodes';

import { getAnchorAccountDiscriminator } from '../discriminators';
import { IdlV00AccountDef } from './idl';
import { structTypeNodeFromAnchorV00 } from './typeNodes';

export function accountNodeFromAnchorV00(
    idl: IdlV00AccountDef,
    origin?: 'anchor' | 'shank',
): AccountNode<StructTypeNode> {
    const idlName = idl.name ?? '';
    const name = camelCase(idlName);
    const idlStruct = idl.type ?? { fields: [], kind: 'struct' };
    let data = structTypeNodeFromAnchorV00(idlStruct);
    assertIsNode(data, 'structTypeNode');
    const hasSeeds = (idl.seeds ?? []).length > 0;

    // Account discriminator.
    let discriminators: DiscriminatorNode[] | undefined;
    if (origin === 'anchor') {
        const discriminator = structFieldTypeNode({
            defaultValue: getAnchorAccountDiscriminator(idlName),
            defaultValueStrategy: 'omitted',
            name: 'discriminator',
            type: bytesTypeNode(),
        });
        data = structTypeNode([discriminator, ...data.fields]);
        discriminators = [fieldDiscriminatorNode('discriminator')];
    }

    return accountNode({
        data,
        discriminators,
        docs: idl.docs ?? [],
        name,
        pda: hasSeeds ? pdaLinkNode(name) : undefined,
        size: idl.size,
    });
}
