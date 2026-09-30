import type { DefinedTypeNode, TypeNode } from 'codama';

import { OPTIONAL_NODE_KINDS } from '../shared/nodes';

/**
 * Convert a Codama type to the TypeScript type of the values its codec
 * encodes, e.g. `integerTypeNode('u64')` gives `number | bigint`.
 */
export function codamaTypeToTS(type: TypeNode | undefined, definedTypes: DefinedTypeNode[]): string {
    if (!type || typeof type !== 'object') return 'unknown';

    switch (type.kind) {
        case 'integerTypeNode':
        case 'fixedPointTypeNode':
        case 'dateTimeTypeNode':
        case 'durationTypeNode':
            return 'number | bigint';
        case 'floatTypeNode':
            return 'number';
        case 'publicKeyTypeNode':
            return 'Address';
        case 'stringTypeNode':
            return 'string';
        case 'booleanTypeNode':
            return 'boolean';
        case 'optionTypeNode':
        case 'remainderOptionTypeNode':
        case 'zeroableOptionTypeNode':
            return `${codamaTypeToTS(type.item, definedTypes)} | null`;
        case 'bytesTypeNode':
            return 'Uint8Array';
        case 'structTypeNode': {
            // Omitted fields always encode their default value, and fields with a default value may be omitted.
            const fields = (type.fields ?? [])
                .filter(field => field.defaultValueStrategy !== 'omitted' || field.defaultValue === undefined)
                .map(field => {
                    const isOptional =
                        field.defaultValue !== undefined || OPTIONAL_NODE_KINDS.includes(field.type.kind);
                    return `${field.identifier}${isOptional ? '?' : ''}: ${codamaTypeToTS(field.type, definedTypes)}`;
                });
            return fields.length === 0 ? '{}' : `{ ${fields.join('; ')} }`;
        }
        case 'enumTypeNode': {
            const variants = type.variants ?? [];
            if (variants.length === 0) return 'unknown /** empty variants in enumTypeNode */';
            // Variants without data may be encoded from their identifier.
            if (variants.every(variant => variant.data === undefined)) {
                return variants.map(variant => `'${variant.identifier}'`).join(' | ');
            }
            return variants
                .map(variant =>
                    variant.data === undefined
                        ? `{ __kind: '${variant.identifier}' }`
                        : `{ __kind: '${variant.identifier}'; data: ${codamaTypeToTS(variant.data, definedTypes)} }`,
                )
                .join(' | ');
        }
        case 'tupleTypeNode': {
            const items = (type.items ?? []).map(item => codamaTypeToTS(item, definedTypes));
            return `[${items.join(', ')}]`;
        }
        case 'arrayTypeNode':
        case 'setTypeNode': {
            const itemType = codamaTypeToTS(type.item, definedTypes);
            const needsParens = itemType.includes(' | ') || itemType.includes(' & ');
            return needsParens ? `(${itemType})[]` : `${itemType}[]`;
        }
        case 'mapTypeNode':
            return `Record<string, ${codamaTypeToTS(type.value, definedTypes)}>`;
        case 'definedTypeLinkNode': {
            const definedType = definedTypes.find(definedType => definedType.identifier === type.identifier);
            if (!definedType) return 'unknown /** DefinedTypeNode not found for definedTypeLinkNode */';
            return codamaTypeToTS(definedType.type, definedTypes);
        }
        default:
            type['kind'] satisfies never;
            return 'unknown';
    }
}
