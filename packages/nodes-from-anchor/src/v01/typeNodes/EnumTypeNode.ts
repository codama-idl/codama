import { EnumTypeNode, enumTypeNode, EnumVariantTypeNode, NumberTypeNode } from '@codama/nodes';

import { IdlV01DefinedFieldsNamed, IdlV01DefinedFieldsTuple, IdlV01EnumVariant, IdlV01TypeDefTyEnum } from '../idl';
import { enumEmptyVariantTypeNodeFromAnchorV01 } from './EnumEmptyVariantTypeNode';
import { enumStructVariantTypeNodeFromAnchorV01 } from './EnumStructVariantTypeNode';
import { enumTupleVariantTypeNodeFromAnchorV01 } from './EnumTupleVariantTypeNode';

export function enumTypeNodeFromAnchorV01(
    idl: IdlV01TypeDefTyEnum,
): EnumTypeNode<EnumVariantTypeNode[], NumberTypeNode> {
    const variants = idl.variants.map((variant): EnumVariantTypeNode => {
        if (!variant.fields || variant.fields.length <= 0) {
            return enumEmptyVariantTypeNodeFromAnchorV01(variant);
        }
        if (isStructVariant(variant)) {
            return enumStructVariantTypeNodeFromAnchorV01(variant);
        }
        return enumTupleVariantTypeNodeFromAnchorV01(
            variant as IdlV01EnumVariant & { fields: IdlV01DefinedFieldsTuple },
        );
    });
    return enumTypeNode(variants);
}

function isStructVariant(
    variant: IdlV01EnumVariant,
): variant is IdlV01EnumVariant & { fields: IdlV01DefinedFieldsNamed } {
    const field = variant.fields![0];
    return typeof field === 'object' && 'name' in field && 'type' in field;
}
