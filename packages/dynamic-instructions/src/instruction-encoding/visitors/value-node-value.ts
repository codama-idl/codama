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

import { AccountError } from '../../shared/errors';

type ResolvedValue = {
    encoding?: string;
    kind: string;
    value: unknown;
};

/**
 * Visitor for resolving regular ValueNode types to their typed values.
 */
export function createValueNodeVisitor(): Visitor<
    ResolvedValue,
    | 'arrayValueNode'
    | 'booleanValueNode'
    | 'bytesValueNode'
    | 'constantValueNode'
    | 'enumValueNode'
    | 'mapValueNode'
    | 'noneValueNode'
    | 'numberValueNode'
    | 'publicKeyValueNode'
    | 'setValueNode'
    | 'someValueNode'
    | 'stringValueNode'
    | 'structValueNode'
    | 'tupleValueNode'
> {
    const visitor: Visitor<
        ResolvedValue,
        | 'arrayValueNode'
        | 'booleanValueNode'
        | 'bytesValueNode'
        | 'constantValueNode'
        | 'enumValueNode'
        | 'mapValueNode'
        | 'noneValueNode'
        | 'numberValueNode'
        | 'publicKeyValueNode'
        | 'setValueNode'
        | 'someValueNode'
        | 'stringValueNode'
        | 'structValueNode'
        | 'tupleValueNode'
    > = {
        visitArrayValue: (node: ArrayValueNode) => ({
            kind: node.kind,
            value: node.items.map(item =>
                visitOrElse(item, visitor, n => {
                    throw new AccountError(`Cannot resolve array item: ${n.kind}`);
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
                throw new AccountError(`Cannot resolve constantValueNode wrapping: ${innerNode.kind}`);
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
                    throw new AccountError(`Cannot resolve map key: ${n.kind}`);
                }),
                value: visitOrElse(entry.value, visitor, n => {
                    throw new AccountError(`Cannot resolve map value: ${n.kind}`);
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
                    throw new AccountError(`Cannot resolve set item: ${n.kind}`);
                }),
            ),
        }),

        visitSomeValue: (node: SomeValueNode) => {
            return visitOrElse(node.value, visitor, innerNode => {
                throw new AccountError(`Cannot resolve someValueNode wrapping: ${innerNode.kind}`);
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
                        throw new AccountError(`Cannot resolve struct field ${field.name}: ${n.kind}`);
                    }),
                ]),
            ),
        }),

        visitTupleValue: (node: TupleValueNode) => ({
            kind: node.kind,
            value: node.items.map(item =>
                visitOrElse(item, visitor, n => {
                    throw new AccountError(`Cannot resolve tuple item: ${n.kind}`);
                }),
            ),
        }),
    };

    return visitor;
}
