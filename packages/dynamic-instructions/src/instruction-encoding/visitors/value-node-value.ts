import { CODAMA_ERROR__UNEXPECTED_NODE_KIND, CodamaError } from '@codama/errors';
import { address } from '@solana/addresses';
import type { Visitor } from 'codama';
import type {
    ArrayValueNode,
    BooleanValueNode,
    BytesValueNode,
    ConstantValueNode,
    EnumValueNode,
    MapValueNode,
    NoneValueNode,
    NumberValueNode,
    PublicKeyValueNode,
    SetValueNode,
    SomeValueNode,
    StringValueNode,
    StructValueNode,
    TupleValueNode,
} from 'codama';
import { visitOrElse } from 'codama';

type ResolvedValue = {
    encoding?: string;
    kind: string;
    value: unknown;
};

export const VALUE_NODE_SUPPORTED_NODE_KINDS = [
    'arrayValueNode',
    'booleanValueNode',
    'bytesValueNode',
    'constantValueNode',
    'enumValueNode',
    'mapValueNode',
    'noneValueNode',
    'numberValueNode',
    'publicKeyValueNode',
    'setValueNode',
    'someValueNode',
    'stringValueNode',
    'structValueNode',
    'tupleValueNode',
] as const;

type ValueNodeSupportedNodeKind = (typeof VALUE_NODE_SUPPORTED_NODE_KINDS)[number];

/**
 * Visitor for resolving regular ValueNode types to their typed values.
 */
export function createValueNodeVisitor(): Visitor<ResolvedValue, ValueNodeSupportedNodeKind> {
    const visitor: Visitor<ResolvedValue, ValueNodeSupportedNodeKind> = {
        visitArrayValue: (node: ArrayValueNode) => ({
            kind: node.kind,
            value: node.items.map(item =>
                visitOrElse(item, visitor, n => {
                    throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                        expectedKinds: [...VALUE_NODE_SUPPORTED_NODE_KINDS],
                        kind: n.kind,
                        node: n,
                    });
                }),
            ),
        }),

        visitBooleanValue: (node: BooleanValueNode) => ({
            kind: node.kind,
            value: node.boolean,
        }),

        visitBytesValue: (node: BytesValueNode) => ({
            encoding: node.encoding,
            kind: node.kind,
            value: node.data,
        }),

        visitConstantValue: (node: ConstantValueNode) => {
            return visitOrElse(node.value, visitor, innerNode => {
                throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                    expectedKinds: [...VALUE_NODE_SUPPORTED_NODE_KINDS],
                    kind: innerNode.kind,
                    node: innerNode,
                });
            });
        },

        visitEnumValue: (node: EnumValueNode) => ({
            kind: node.kind,
            value: node.variant,
        }),

        visitMapValue: (node: MapValueNode) => ({
            kind: node.kind,
            value: node.entries.map(entry => ({
                key: visitOrElse(entry.key, visitor, n => {
                    throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                        expectedKinds: [...VALUE_NODE_SUPPORTED_NODE_KINDS],
                        kind: n.kind,
                        node: n,
                    });
                }),
                value: visitOrElse(entry.value, visitor, n => {
                    throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                        expectedKinds: [...VALUE_NODE_SUPPORTED_NODE_KINDS],
                        kind: n.kind,
                        node: n,
                    });
                }),
            })),
        }),

        visitNoneValue: (node: NoneValueNode) => ({
            kind: node.kind,
            value: null,
        }),

        visitNumberValue: (node: NumberValueNode) => ({
            kind: node.kind,
            value: node.number,
        }),

        visitPublicKeyValue: (node: PublicKeyValueNode) => ({
            kind: node.kind,
            value: address(node.publicKey),
        }),

        visitSetValue: (node: SetValueNode) => ({
            kind: node.kind,
            value: node.items.map(item =>
                visitOrElse(item, visitor, n => {
                    throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                        expectedKinds: [...VALUE_NODE_SUPPORTED_NODE_KINDS],
                        kind: n.kind,
                        node: n,
                    });
                }),
            ),
        }),

        visitSomeValue: (node: SomeValueNode) => {
            return visitOrElse(node.value, visitor, innerNode => {
                throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                    expectedKinds: [...VALUE_NODE_SUPPORTED_NODE_KINDS],
                    kind: innerNode.kind,
                    node: innerNode,
                });
            });
        },

        visitStringValue: (node: StringValueNode) => ({
            kind: node.kind,
            value: node.string,
        }),

        visitStructValue: (node: StructValueNode) => ({
            kind: node.kind,
            value: Object.fromEntries(
                node.fields.map(field => [
                    field.name,
                    visitOrElse(field.value, visitor, n => {
                        throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                            expectedKinds: [...VALUE_NODE_SUPPORTED_NODE_KINDS],
                            kind: n.kind,
                            node: n,
                        });
                    }),
                ]),
            ),
        }),

        visitTupleValue: (node: TupleValueNode) => ({
            kind: node.kind,
            value: node.items.map(item =>
                visitOrElse(item, visitor, n => {
                    throw new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
                        expectedKinds: [...VALUE_NODE_SUPPORTED_NODE_KINDS],
                        kind: n.kind,
                        node: n,
                    });
                }),
            ),
        }),
    };

    return visitor;
}
