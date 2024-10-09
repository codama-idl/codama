import { numberTypeNode, OptionTypeNode, optionTypeNode } from '@codama/nodes';

import { IdlV01TypeCOption, IdlV01TypeOption } from '../idl';
import { typeNodeFromAnchorV01 } from './TypeNode';

export function optionTypeNodeFromAnchorV01(idl: IdlV01TypeCOption | IdlV01TypeOption): OptionTypeNode {
    const item = 'option' in idl ? idl.option : idl.coption;
    const hasOptionField = 'option' in idl;

    const prefix = numberTypeNode(hasOptionField ? 'u8' : 'u32');
    const fixed = !hasOptionField;

    return optionTypeNode(typeNodeFromAnchorV01(item), {
        fixed,
        prefix,
    });
}
