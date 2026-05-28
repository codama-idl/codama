import type { DefinedTypeNode, TypeNode } from 'codama';

/**
 * Convert Codama type to TypeScript type string.
 */
export function codamaTypeToTS(type: TypeNode | undefined, definedTypes: DefinedTypeNode[]): string {
    if (!type || typeof type !== 'object') return 'unknown';

    switch (type.kind) {
        case 'numberTypeNode':
            return ['u64', 'u128', 'i64', 'i128'].includes(type.format) ? 'number | bigint' : 'number';
        case 'publicKeyTypeNode':
            return 'Address';
        case 'stringTypeNode':
            return 'string';
        case 'booleanTypeNode':
            return 'boolean';
        case 'optionTypeNode':
            return `${codamaTypeToTS(type.item, definedTypes)} | null`;
        case 'remainderOptionTypeNode':
        case 'zeroableOptionTypeNode':
            return `${codamaTypeToTS(type.item, definedTypes)} | null`;
        case 'bytesTypeNode':
            return 'Uint8Array';
        case 'fixedSizeTypeNode':
        case 'sizePrefixTypeNode':
        case 'hiddenPrefixTypeNode':
        case 'preOffsetTypeNode':
        case 'postOffsetTypeNode':
        case 'hiddenSuffixTypeNode':
        case 'sentinelTypeNode':
            return codamaTypeToTS(type.type, definedTypes);
        case 'amountTypeNode':
        case 'solAmountTypeNode':
            return 'number | bigint';
        case 'structTypeNode': {
            if (!type.fields || type.fields.length === 0) return '{}';
            const fields = type.fields
                .filter(f => f.defaultValueStrategy !== 'omitted')
                .map(f => `${f.name}: ${codamaTypeToTS(f.type, definedTypes)}`);
            if (fields.length === 0) return '{}';
            return `{ ${fields.join('; ')} }`;
        }
        case 'enumTypeNode': {
            if (!type.variants || type.variants.length === 0) return 'unknown /** empty variants in enumTypeNode */';
            const allEmpty = type.variants.every(v => v.kind === 'enumEmptyVariantTypeNode');
            if (allEmpty) {
                return type.variants.map(v => `'${v.name}'`).join(' | ');
            }
            const variantTypes = type.variants.map(v => {
                if (v.kind === 'enumEmptyVariantTypeNode') {
                    return `{ __kind: '${v.name}' }`;
                }
                if (v.kind === 'enumStructVariantTypeNode' && v.struct) {
                    const inner = codamaTypeToTS(v.struct, definedTypes);
                    return `{ __kind: '${v.name}' } & ${inner}`;
                }
                if (v.kind === 'enumTupleVariantTypeNode' && v.tuple) {
                    const inner = codamaTypeToTS(v.tuple, definedTypes);
                    return `{ __kind: '${v.name}'; fields: ${inner} }`;
                }
                return `{ __kind: '${v.name}' }`;
            });
            return variantTypes.join(' | ');
        }
        case 'tupleTypeNode': {
            if (!type.items || type.items.length === 0) return '[]';
            const items = type.items.map(i => codamaTypeToTS(i, definedTypes));
            return `[${items.join(', ')}]`;
        }
        case 'arrayTypeNode':
        case 'setTypeNode': {
            const itemType = codamaTypeToTS(type.item, definedTypes);
            const needsParens = itemType.includes(' | ') || itemType.includes(' & ');
            return needsParens ? `(${itemType})[]` : `${itemType}[]`;
        }
        case 'mapTypeNode': {
            const v = codamaTypeToTS(type.value, definedTypes);
            return `Record<string, ${v}>`;
        }
        case 'definedTypeLinkNode': {
            if (!type.name) return 'unknown /** name missing in definedTypeLinkNode */';
            const def = definedTypes.find(d => d.name === type.name);
            if (!def) return 'unknown /** DefinedTypeNode not found for definedTypeLinkNode */';
            return codamaTypeToTS(def.type, definedTypes);
        }
        case 'dateTimeTypeNode': {
            return codamaTypeToTS(type.number, definedTypes);
        }
        default:
            type['kind'] satisfies never;
            return 'unknown';
    }
}
