import type { ReadonlyUint8Array } from '@solana/codecs';
import type { Visitor } from 'codama';
import type {
    BooleanValueNode,
    BytesValueNode,
    EnumValueNode,
    NumberValueNode,
    PublicKeyValueNode,
    StringValueNode,
} from 'codama';

export const DEFAULT_VALUE_ENCODER_SUPPORTED_NODE_KINDS = [
    'booleanValueNode',
    'bytesValueNode',
    'enumValueNode',
    'noneValueNode',
    'numberValueNode',
    'publicKeyValueNode',
    'stringValueNode',
] as const;

type DefaultValueEncoderSupportedNodeKind = (typeof DEFAULT_VALUE_ENCODER_SUPPORTED_NODE_KINDS)[number];

/**
 * Visitor for encoding default (omitted) values for instruction arguments.
 *
 * Today, Anchor/Codama primarily uses omitted defaults for discriminators
 * (`bytesValueNode`), but this visitor is intentionally extensible as we
 * expand node coverage over time.
 */
export function createDefaultValueEncoderVisitor(codec: {
    encode: (value: unknown) => ReadonlyUint8Array;
}): Visitor<ReadonlyUint8Array, DefaultValueEncoderSupportedNodeKind> {
    return {
        visitBooleanValue: (node: BooleanValueNode) => codec.encode(node.boolean),
        visitBytesValue: (node: BytesValueNode) => codec.encode([node.encoding, node.data]),
        visitEnumValue: (node: EnumValueNode) => codec.encode(node.variant),
        visitNoneValue: () => codec.encode(null),
        visitNumberValue: (node: NumberValueNode) => codec.encode(node.number),
        visitPublicKeyValue: (node: PublicKeyValueNode) => codec.encode(node.publicKey),
        visitStringValue: (node: StringValueNode) => codec.encode(node.string),
    };
}
