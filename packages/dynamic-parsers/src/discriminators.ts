import { CodecAndValueVisitors, containsBytes, ReadonlyUint8Array } from '@codama/dynamic-codecs';
import {
    CODAMA_ERROR__DISCRIMINATOR_FIELD_HAS_NO_DEFAULT_VALUE,
    CODAMA_ERROR__DISCRIMINATOR_FIELD_NOT_FOUND,
    CodamaError,
} from '@codama/errors';
import {
    ConstantDiscriminatorNode,
    constantDiscriminatorNode,
    constantValueNode,
    DiscriminatorNode,
    FieldDiscriminatorNode,
    isNode,
    SizeDiscriminatorNode,
    StructFieldTypeNode,
    TypeNode,
} from '@codama/nodes';
import {
    getLastNodeFromPath,
    LinkableDictionary,
    NodePath,
    NodeStack,
    ProvidedScope,
    visit,
} from '@codama/visitors-core';

/**
 * The codec and value visitors used to encode discriminators, along with the
 * linkables, stack and provided scope they share. The linkables and stack are
 * used to find discriminator fields within linked types, and the scope to
 * resolve their injected default values.
 */
export type DiscriminatorContext = CodecAndValueVisitors & {
    linkables: LinkableDictionary;
    scope: ProvidedScope;
    stack: NodeStack;
};

/**
 * Whether the bytes match every discriminator of a node whose data is
 * described by `dataType`. The stack of the context must point to that node.
 */
export function matchDiscriminators(
    bytes: ReadonlyUint8Array,
    discriminators: DiscriminatorNode[],
    dataType: TypeNode | undefined,
    context: DiscriminatorContext,
): boolean {
    return (
        discriminators.length > 0 &&
        discriminators.every(discriminator => matchDiscriminator(bytes, discriminator, dataType, context))
    );
}

function matchDiscriminator(
    bytes: ReadonlyUint8Array,
    discriminator: DiscriminatorNode,
    dataType: TypeNode | undefined,
    context: DiscriminatorContext,
): boolean {
    switch (discriminator.kind) {
        case 'constantDiscriminatorNode':
            return matchConstantDiscriminator(bytes, discriminator, context);
        case 'fieldDiscriminatorNode':
            return matchFieldDiscriminator(bytes, discriminator, dataType, context);
        case 'sizeDiscriminatorNode':
            return matchSizeDiscriminator(bytes, discriminator);
    }
}

function matchConstantDiscriminator(
    bytes: ReadonlyUint8Array,
    discriminator: ConstantDiscriminatorNode,
    { codecVisitor, valueVisitor }: CodecAndValueVisitors,
): boolean {
    const codec = visit(discriminator.constant.type, codecVisitor);
    const value = visit(discriminator.constant.value, valueVisitor);
    return containsBytes(bytes, codec.encode(value), discriminator.offset);
}

function matchFieldDiscriminator(
    bytes: ReadonlyUint8Array,
    discriminator: FieldDiscriminatorNode,
    dataType: TypeNode | undefined,
    context: DiscriminatorContext,
): boolean {
    const segments = discriminator.path.split('.');
    const resolved = findDataField(dataType, segments, context.stack.getPath(), context.linkables);
    if (!resolved) {
        throw new CodamaError(CODAMA_ERROR__DISCRIMINATOR_FIELD_NOT_FOUND, { field: discriminator.path });
    }
    const field = getLastNodeFromPath(resolved);
    if (!field.defaultValue) {
        throw new CodamaError(CODAMA_ERROR__DISCRIMINATOR_FIELD_HAS_NO_DEFAULT_VALUE, { field: discriminator.path });
    }
    const constant = constantValueNode(field.type, field.defaultValue);
    const constantDiscriminator = constantDiscriminatorNode(constant, { offset: discriminator.offset });
    // Encode from the field's own path, so links within its type resolve in the program defining it.
    return context.stack.withPath(resolved, () => matchConstantDiscriminator(bytes, constantDiscriminator, context));
}

function matchSizeDiscriminator(bytes: ReadonlyUint8Array, discriminator: SizeDiscriminatorNode): boolean {
    return bytes.length === discriminator.size;
}

/**
 * Find the struct field at the given path segments within `type`, following
 * `definedTypeLinkNode`s, and return its full path.
 */
function findDataField(
    type: TypeNode | undefined,
    segments: string[],
    path: NodePath,
    linkables: LinkableDictionary,
): NodePath<StructFieldTypeNode> | undefined {
    if (!type) return undefined;
    if (isNode(type, 'definedTypeLinkNode')) {
        const linkedPath = linkables.getPathOrThrow([...path, type]);
        return findDataField(getLastNodeFromPath(linkedPath).type, segments, linkedPath, linkables);
    }
    if (!isNode(type, 'structTypeNode')) return undefined;
    const [identifier, ...rest] = segments;
    const field = (type.fields ?? []).find(field => field.identifier === identifier);
    if (!field) return undefined;
    const fieldPath = [...path, type, field] as unknown as NodePath<StructFieldTypeNode>;
    return rest.length === 0 ? fieldPath : findDataField(field.type, rest, fieldPath, linkables);
}
