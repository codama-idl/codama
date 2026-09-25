import { CODAMA_ERROR__ANCHOR__EVENT_TYPE_MISSING, CodamaError } from '@codama/errors';
import {
    addTypeNodeTransforms,
    constantDiscriminatorNode,
    constantValueNode,
    EventNode,
    eventNode,
    hiddenPrefixTransformNode,
} from '@codama/nodes';

import { getAnchorDiscriminatorV01 } from '../discriminators';
import { docsFromAnchor, fixedSizeBytesTypeNode } from '../utils';
import type { IdlV01Event, IdlV01TypeDef } from './idl';
import { typeNodeFromAnchorV01 } from './typeNodes';
import type { GenericsV01 } from './unwrapGenerics';

export function eventNodeFromAnchorV01(idl: IdlV01Event, types: IdlV01TypeDef[], generics: GenericsV01): EventNode {
    const type = types.find(candidate => candidate.name === idl.name);

    if (!type) {
        throw new CodamaError(CODAMA_ERROR__ANCHOR__EVENT_TYPE_MISSING, { name: idl.name });
    }

    const data = typeNodeFromAnchorV01(type.type, generics);
    const discriminator = getAnchorDiscriminatorV01(idl.discriminator);
    const discriminatorConstant = constantValueNode(fixedSizeBytesTypeNode(idl.discriminator.length), discriminator);

    return eventNode({
        data: addTypeNodeTransforms(data, [hiddenPrefixTransformNode([discriminatorConstant])]),
        discriminators: [constantDiscriminatorNode(discriminatorConstant)],
        docs: docsFromAnchor(type.docs),
        identifier: idl.name,
    });
}
