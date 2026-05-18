import {
    bytesTypeNode,
    camelCase,
    constantDiscriminatorNode,
    constantValueNode,
    EventNode,
    eventNode,
    fixedSizeTypeNode,
    hiddenPrefixTypeNode,
} from '@codama/nodes';

import { getAnchorEventDiscriminatorV00 } from '../discriminators';
import { IdlV00Event } from './idl';
import { structTypeNodeFromAnchorV00 } from './typeNodes';

export function eventNodeFromAnchorV00(idl: IdlV00Event): EventNode {
    const idlName = idl.name ?? '';
    const name = camelCase(idlName);
    const data = structTypeNodeFromAnchorV00({ fields: idl.fields ?? [], kind: 'struct' });
    const discriminator = getAnchorEventDiscriminatorV00(idlName);
    const discriminatorConstant = constantValueNode(fixedSizeTypeNode(bytesTypeNode(), 8), discriminator);

    return eventNode({
        data: hiddenPrefixTypeNode(data, [discriminatorConstant]),
        discriminators: [constantDiscriminatorNode(discriminatorConstant)],
        name,
    });
}
