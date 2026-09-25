import {
    booleanValueNode,
    PluginNode,
    pluginNode,
    StructFieldTypeNode,
    BytesTypeNode,
    bytesTypeNode,
    bytesValueNode,
    fixedSizeTransformNode,
    floatValueNode,
    integerTypeNode,
    integerValueNode,
    isNode,
    publicKeyValueNode,
    sizePrefixTransformNode,
    StringTypeNode,
    stringTypeNode,
    stringValueNode,
    TypeNode,
    ValueNode,
} from '@codama/nodes';

export function hex(bytes: number[] | Uint8Array): string {
    return Array.from(bytes).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}

/** Join the lines of Anchor docs into a single Markdown string, if any. */
export function docsFromAnchor(docs: string[] | undefined): string | undefined {
    return docs && docs.length > 0 ? docs.join('\n') : undefined;
}

/** A fixed-size byte array, e.g. for Anchor's 8-byte discriminators. */
export function fixedSizeBytesTypeNode(size: number): BytesTypeNode {
    return bytesTypeNode({ transforms: [fixedSizeTransformNode(size)] });
}

/** A Borsh string or byte array, prefixed by its `u32` size. */
export function borshSizePrefixedTypeNode(type: 'bytes' | 'string'): BytesTypeNode | StringTypeNode {
    const transforms = [sizePrefixTransformNode(integerTypeNode('u32'))];
    return type === 'string' ? stringTypeNode('utf8', { transforms }) : bytesTypeNode({ transforms });
}

/**
 * Remove the Borsh `u32` size prefix of a string or byte array, if any.
 *
 * Anchor uses unprefixed strings and byte arrays for PDA seeds even though
 * the corresponding arguments are Borsh size-prefixed.
 */
export function removeBorshSizePrefix(type: TypeNode): TypeNode {
    const isBorshSizePrefixed =
        (isNode(type, 'bytesTypeNode') || (isNode(type, 'stringTypeNode') && type.encoding === 'utf8')) &&
        type.transforms?.length === 1 &&
        isNode(type.transforms[0], 'sizePrefixTransformNode') &&
        type.transforms[0].prefix.format === 'u32';
    if (!isBorshSizePrefixed) return type;
    return isNode(type, 'stringTypeNode') ? stringTypeNode('utf8') : bytesTypeNode();
}

function isByteArray(value: unknown): value is number[] {
    return Array.isArray(value) && value.every(n => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 255);
}

/**
 * The canonical spelling of a decimal float string, e.g. `007.50` → `7.5`.
 *
 * Canonicalisation is purely textual so that no precision is lost: the
 * value is not rounded to the float it is parsed into.
 */
function canonicalFloat(valueString: string): string | undefined {
    const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(valueString);
    if (!match) return undefined;
    const [, sign, integer, fraction = ''] = match;
    const integerPart = integer.replace(/^0+(?=\d)/, '');
    const fractionPart = fraction.replace(/0+$/, '');
    return `${sign}${integerPart}${fractionPart ? `.${fractionPart}` : ''}`;
}

export function parseConstantValue(valueString: string, type: TypeNode): { type: TypeNode; value: ValueNode } {
    const stringFallback = { type: stringTypeNode('utf8'), value: stringValueNode(valueString) };

    if (isNode(type, 'bytesTypeNode')) {
        try {
            const parsed: unknown = JSON.parse(valueString);
            if (isByteArray(parsed)) {
                return { type, value: bytesValueNode('base16', hex(new Uint8Array(parsed))) };
            }
        } catch {
            // Not JSON: fall through to the string fallback below.
        }
        return stringFallback;
    }

    if (isNode(type, 'integerTypeNode')) {
        // Integers are kept as strings, so 64- and 128-bit values stay lossless.
        if (!/^-?\d+$/.test(valueString)) return stringFallback;
        return { type, value: integerValueNode(BigInt(valueString).toString()) };
    }

    if (isNode(type, 'floatTypeNode')) {
        const canonical = canonicalFloat(valueString);
        return canonical === undefined ? stringFallback : { type, value: floatValueNode(canonical) };
    }

    if (isNode(type, 'booleanTypeNode')) {
        if (valueString === 'true') return { type, value: booleanValueNode(true) };
        if (valueString === 'false') return { type, value: booleanValueNode(false) };
        return stringFallback;
    }

    if (isNode(type, 'publicKeyTypeNode')) {
        return { type, value: publicKeyValueNode(valueString) };
    }

    return { type, value: stringValueNode(valueString) };
}

/** Defined types of a program, keyed by identifier, used to follow `definedTypeLinkNode`s. */
export type DefinedTypeMap = ReadonlyMap<string, TypeNode>;

/**
 * The type found at the end of the given field path (e.g. `["params",
 * "seed"]`) within struct fields, following links to the given defined
 * types, or `undefined` if the path cannot be followed through structs.
 */
export function getFieldPathType(
    fields: StructFieldTypeNode[],
    path: string[],
    definedTypes: DefinedTypeMap,
): TypeNode | undefined {
    const [identifier, ...rest] = path;
    const field = fields.find(candidate => candidate.identifier === identifier);
    if (!field) return undefined;
    if (rest.length === 0) return field.type;
    const struct = resolveDefinedTypeLinks(field.type, definedTypes);
    if (!struct || !isNode(struct, 'structTypeNode')) return undefined;
    return getFieldPathType(struct.fields ?? [], rest, definedTypes);
}

function resolveDefinedTypeLinks(type: TypeNode, definedTypes: DefinedTypeMap): TypeNode | undefined {
    const visited = new Set<string>();
    let resolved: TypeNode | undefined = type;
    while (resolved && isNode(resolved, 'definedTypeLinkNode')) {
        // Links to other programs cannot be followed, and cycles cannot be walked.
        if (resolved.program || visited.has(resolved.identifier)) return undefined;
        visited.add(resolved.identifier);
        resolved = definedTypes.get(resolved.identifier);
    }
    return resolved;
}

/**
 * The `anchor.relations` plugin of an instruction account, listing the
 * identifiers of the instruction accounts that must hold its address in
 * their data (i.e. Anchor's `has_one` constraints targeting it).
 */
export function anchorRelationsPluginNode(relations: string[]): PluginNode[] | undefined {
    return relations.length > 0 ? [pluginNode('anchor.relations', relations)] : undefined;
}
