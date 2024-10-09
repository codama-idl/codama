import { EnumTypeNode, enumTypeNode, EnumVariantTypeNode, NumberTypeNode, numberTypeNode } from '@codama/nodes';

import { IdlV00EnumFieldsNamed, IdlV00EnumFieldsTuple, IdlV00EnumVariant, IdlV00TypeDefTyEnum } from '../idl';
import { enumEmptyVariantTypeNodeFromAnchorV00 } from './EnumEmptyVariantTypeNode';
import { enumStructVariantTypeNodeFromAnchorV00 } from './EnumStructVariantTypeNode';
import { enumTupleVariantTypeNodeFromAnchorV00 } from './EnumTupleVariantTypeNode';

export function enumTypeNodeFromAnchorV00(
    idl: IdlV00TypeDefTyEnum,
): EnumTypeNode<EnumVariantTypeNode[], NumberTypeNode> {
    const variants = idl.variants.map((variant): EnumVariantTypeNode => {
        if (!variant.fields || variant.fields.length <= 0) {
            return enumEmptyVariantTypeNodeFromAnchorV00(variant);
        }
        if (isStructVariant(variant)) {
            return enumStructVariantTypeNodeFromAnchorV00(variant);
        }
        return enumTupleVariantTypeNodeFromAnchorV00(variant as IdlV00EnumVariant & { fields: IdlV00EnumFieldsTuple });
    });
    return enumTypeNode(variants, {
        size: idl.size ? numberTypeNode(idl.size) : undefined,
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isStructVariant(variant: IdlV00EnumVariant): variant is IdlV00EnumVariant & { fields: IdlV00EnumFieldsNamed } {
    const field = variant.fields![0];
    return typeof field === 'object' && 'name' in field && 'type' in field;
}
