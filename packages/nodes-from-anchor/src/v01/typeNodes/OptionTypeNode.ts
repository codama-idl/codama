import { numberTypeNode, OptionTypeNode, optionTypeNode } from '@codama/nodes';

import type { IdlV01TypeCOption, IdlV01TypeOption } from '../idl';
import type { GenericsV01 } from '../unwrapGenerics';
import { typeNodeFromAnchorV01 } from './TypeNode';

export function optionTypeNodeFromAnchorV01(
    idl: IdlV01TypeCOption | IdlV01TypeOption,
    generics: GenericsV01,
): OptionTypeNode {
    const item = 'option' in idl ? idl.option : idl.coption;
    const hasOptionField = 'option' in idl;

    const prefix = numberTypeNode(hasOptionField ? 'u8' : 'u32');
    const fixed = !hasOptionField;

    return optionTypeNode(typeNodeFromAnchorV01(item, generics), {
        fixed,
        prefix,
    });
}
