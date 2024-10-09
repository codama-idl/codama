import { InstructionArgumentNode, instructionArgumentNode } from '@codama/nodes';

import { IdlV00Field } from './idl';
import { typeNodeFromAnchorV00 } from './typeNodes';

export function instructionArgumentNodeFromAnchorV00(idl: IdlV00Field): InstructionArgumentNode {
    return instructionArgumentNode({
        docs: idl.docs ?? [],
        name: idl.name ?? '',
        type: typeNodeFromAnchorV00(idl.type),
    });
}
