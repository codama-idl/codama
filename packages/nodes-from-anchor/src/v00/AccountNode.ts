import {
    AccountNode,
    accountNode,
    assertIsNode,
    DiscriminatorNode,
    fieldDiscriminatorNode,
    pdaLinkNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';

import { getAnchorAccountDiscriminatorV00 } from '../discriminators';
import { docsFromAnchor, fixedSizeBytesTypeNode } from '../utils';
import { IdlV00AccountDef } from './idl';
import { structTypeNodeFromAnchorV00 } from './typeNodes';

export function accountNodeFromAnchorV00(idl: IdlV00AccountDef, origin?: 'anchor' | 'shank'): AccountNode {
    const name = idl.name ?? '';
    const idlStruct = idl.type ?? { fields: [], kind: 'struct' };
    let data = structTypeNodeFromAnchorV00(idlStruct);
    assertIsNode(data, 'structTypeNode');
    const hasSeeds = (idl.seeds ?? []).length > 0;

    // Account discriminator.
    let discriminators: DiscriminatorNode[] | undefined;
    if (origin === 'anchor') {
        const discriminator = structFieldTypeNode({
            defaultValue: getAnchorAccountDiscriminatorV00(name),
            defaultValueStrategy: 'omitted',
            identifier: 'discriminator',
            type: fixedSizeBytesTypeNode(8),
        });
        data = structTypeNode([discriminator, ...(data.fields ?? [])]);
        discriminators = [fieldDiscriminatorNode('discriminator')];
    }

    return accountNode({
        data,
        discriminators,
        docs: docsFromAnchor(idl.docs),
        identifier: name,
        pda: hasSeeds ? pdaLinkNode(name) : undefined,
        size: idl.size,
    });
}
