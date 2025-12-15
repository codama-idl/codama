import {
    AccountNode,
    accountNode,
    assertIsNode,
    bytesTypeNode,
    camelCase,
    DiscriminatorNode,
    fieldDiscriminatorNode,
    fixedSizeTypeNode,
    pdaLinkNode,
    structFieldTypeNode,
    StructTypeNode,
    structTypeNode,
} from '@codama/nodes';

import { getAnchorAccountDiscriminatorV00 } from '../discriminators';
import { IdlV00AccountDef } from './idl';
import { structTypeNodeFromAnchorV00 } from './typeNodes';

export function accountNodeFromAnchorV00(idl: IdlV00AccountDef, addDiscriminator = false): AccountNode<StructTypeNode> {
    const idlName = idl.name ?? '';
    const name = camelCase(idlName);
    const idlStruct = idl.type ?? { fields: [], kind: 'struct' };
    let data = structTypeNodeFromAnchorV00(idlStruct);
    assertIsNode(data, 'structTypeNode');
    const hasSeeds = (idl.seeds ?? []).length > 0;

    // Account discriminator.
    let discriminators: DiscriminatorNode[] | undefined;
    if (addDiscriminator) {
        const discriminator = structFieldTypeNode({
            defaultValue: getAnchorAccountDiscriminatorV00(idlName),
            defaultValueStrategy: 'omitted',
            name: 'discriminator',
            type: fixedSizeTypeNode(bytesTypeNode(), 8),
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
