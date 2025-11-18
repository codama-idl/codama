import { InstructionArgumentNode, instructionArgumentNode } from '@codama/nodes';

import type { IdlV01Field } from './idl';
import { typeNodeFromAnchorV01 } from './typeNodes';
import type { GenericsV01 } from './unwrapGenerics';

export function instructionArgumentNodeFromAnchorV01(idl: IdlV01Field, generics: GenericsV01): InstructionArgumentNode {
    return instructionArgumentNode({
        docs: idl.docs ?? [],
        name: idl.name,
        type: typeNodeFromAnchorV01(idl.type, generics),
    });
}
