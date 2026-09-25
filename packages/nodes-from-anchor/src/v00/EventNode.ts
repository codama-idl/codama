import {
    addTypeNodeTransforms,
    constantDiscriminatorNode,
    constantValueNode,
    EventNode,
    eventNode,
    hiddenPrefixTransformNode,
} from '@codama/nodes';

import { getAnchorEventDiscriminatorV00 } from '../discriminators';
import { fixedSizeBytesTypeNode } from '../utils';
import { IdlV00Event } from './idl';
import { structTypeNodeFromAnchorV00 } from './typeNodes';

export function eventNodeFromAnchorV00(idl: IdlV00Event): EventNode {
    const name = idl.name ?? '';
    const data = structTypeNodeFromAnchorV00({ fields: idl.fields ?? [], kind: 'struct' });
    const discriminatorConstant = constantValueNode(fixedSizeBytesTypeNode(8), getAnchorEventDiscriminatorV00(name));

    return eventNode({
        data: addTypeNodeTransforms(data, [hiddenPrefixTransformNode([discriminatorConstant])]),
        discriminators: [constantDiscriminatorNode(discriminatorConstant)],
        identifier: name,
    });
}
