import { InstructionArgumentNode, instructionArgumentNode } from '@codama/nodes';

import { IdlV01Field } from './idl';
import { typeNodeFromAnchorV01 } from './typeNodes';

export function instructionArgumentNodeFromAnchorV01(idl: IdlV01Field): InstructionArgumentNode {
    return instructionArgumentNode({
        docs: idl.docs ?? [],
        name: idl.name,
        type: typeNodeFromAnchorV01(idl.type),
    });
}
