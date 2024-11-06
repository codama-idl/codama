import { CodecAndValueVisitors, containsBytes, ReadonlyUint8Array } from '@codama/dynamic-codecs';
import {
    CODAMA_ERROR__DISCRIMINATOR_FIELD_HAS_NO_DEFAULT_VALUE,
    CODAMA_ERROR__DISCRIMINATOR_FIELD_NOT_FOUND,
    CodamaError,
} from '@codama/errors';
import {
    assertIsNode,
    ConstantDiscriminatorNode,
    constantDiscriminatorNode,
    constantValueNode,
    DiscriminatorNode,
    FieldDiscriminatorNode,
    isNode,
    SizeDiscriminatorNode,
    StructTypeNode,
} from '@codama/nodes';
import { visit } from '@codama/visitors-core';

export function matchDiscriminators(
    bytes: ReadonlyUint8Array,
    discriminators: DiscriminatorNode[],
    struct: StructTypeNode,
    visitors: CodecAndValueVisitors,
): boolean {
    return (
        discriminators.length > 0 &&
        discriminators.every(discriminator => matchDiscriminator(bytes, discriminator, struct, visitors))
    );
}

function matchDiscriminator(
    bytes: ReadonlyUint8Array,
    discriminator: DiscriminatorNode,
    struct: StructTypeNode,
    visitors: CodecAndValueVisitors,
): boolean {
    if (isNode(discriminator, 'constantDiscriminatorNode')) {
        return matchConstantDiscriminator(bytes, discriminator, visitors);
    }
    if (isNode(discriminator, 'fieldDiscriminatorNode')) {
        return matchFieldDiscriminator(bytes, discriminator, struct, visitors);
    }
    assertIsNode(discriminator, 'sizeDiscriminatorNode');
    return matchSizeDiscriminator(bytes, discriminator);
}

function matchConstantDiscriminator(
    bytes: ReadonlyUint8Array,
    discriminator: ConstantDiscriminatorNode,
    { codecVisitor, valueVisitor }: CodecAndValueVisitors,
): boolean {
    const codec = visit(discriminator.constant.type, codecVisitor);
    const value = visit(discriminator.constant.value, valueVisitor);
    const bytesToMatch = codec.encode(value);
    return containsBytes(bytes, bytesToMatch, discriminator.offset);
}

function matchFieldDiscriminator(
    bytes: ReadonlyUint8Array,
    discriminator: FieldDiscriminatorNode,
    struct: StructTypeNode,
    visitors: CodecAndValueVisitors,
): boolean {
    const field = struct.fields.find(field => field.name === discriminator.name);
    if (!field) {
        throw new CodamaError(CODAMA_ERROR__DISCRIMINATOR_FIELD_NOT_FOUND, {
            field: discriminator.name,
        });
    }
    if (!field.defaultValue) {
        throw new CodamaError(CODAMA_ERROR__DISCRIMINATOR_FIELD_HAS_NO_DEFAULT_VALUE, {
            field: discriminator.name,
        });
    }
    const constantNode = constantValueNode(field.type, field.defaultValue);
    const constantDiscriminator = constantDiscriminatorNode(constantNode, discriminator.offset);
    return matchConstantDiscriminator(bytes, constantDiscriminator, visitors);
}

function matchSizeDiscriminator(bytes: ReadonlyUint8Array, discriminator: SizeDiscriminatorNode): boolean {
    return bytes.length === discriminator.size;
}
