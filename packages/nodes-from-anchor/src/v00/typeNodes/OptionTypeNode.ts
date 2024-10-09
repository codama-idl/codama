import { numberTypeNode, OptionTypeNode, optionTypeNode } from '@codama/nodes';

import { IdlV00TypeOption } from '../idl';
import { typeNodeFromAnchorV00 } from './TypeNode';

export function optionTypeNodeFromAnchorV00(idl: IdlV00TypeOption): OptionTypeNode {
    const item = 'option' in idl ? idl.option : idl.coption;
    const defaultPrefix = numberTypeNode('option' in idl ? 'u8' : 'u32');
    const defaultFixed = !('option' in idl);
    return optionTypeNode(typeNodeFromAnchorV00(item), {
        fixed: idl.fixed !== undefined ? idl.fixed : defaultFixed,
        prefix: idl.prefix ? numberTypeNode(idl.prefix) : defaultPrefix,
    });
}
