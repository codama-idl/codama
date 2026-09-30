import { CODAMA_ERROR__ENUM_VARIANT_NOT_FOUND, CodamaError } from '@codama/errors';
import { assertIsNode, bytesTypeNode, ValueNode, VALUE_NODE_KINDS } from '@codama/nodes';
import {
    LinkableDictionary,
    NodeStack,
    pipe,
    ProvidedScope,
    recordNodeStackVisitor,
    visit,
    Visitor,
} from '@codama/visitors-core';

import { CodecVisitorOptions, getConstantValueBytes, getNodeValueCodecVisitor } from './codecs';

/**
 * A visitor that returns the raw JavaScript value of the visited value node, in the
 * same format as the codecs of {@link getNodeValueCodec}, e.g. `integerValueNode('42')`
 * returns `42n`.
 *
 * The `stack` must hold the ancestors of the visited node to resolve enum links, and the
 * `scope` must hold the `provides` of its enclosing instructions to resolve injected values.
 */
export function getValueNodeVisitor(
    linkables: LinkableDictionary,
    options: {
        codecVisitorFactory?: () => ReturnType<typeof getNodeValueCodecVisitor>;
        codecVisitorOptions?: CodecVisitorOptions;
        scope?: ProvidedScope;
        stack?: NodeStack;
    } = {},
): Visitor<unknown, ValueNode['kind']> {
    const stack = options.stack ?? new NodeStack();
    const scope = options.scope ?? new ProvidedScope();
    let cachedCodecVisitor: ReturnType<typeof getNodeValueCodecVisitor> | null = null;
    const codecVisitorFactory =
        options.codecVisitorFactory ??
        (() =>
            (cachedCodecVisitor ??= getNodeValueCodecVisitor(linkables, {
                ...options.codecVisitorOptions,
                scope,
                stack,
            })));

    const baseVisitor: Visitor<unknown, ValueNode['kind']> = {
        visitArrayValue(node) {
            return (node.items ?? []).map(item => visit(item, this));
        },
        visitBooleanValue(node) {
            return node.boolean;
        },
        visitBytesValue(node) {
            return [node.encoding, node.data];
        },
        visitConstantValue(node) {
            const codecVisitor = codecVisitorFactory();
            const bytes = getConstantValueBytes(node, codecVisitor, this);
            return visit(bytesTypeNode(), codecVisitor).decode(bytes);
        },
        visitEnumValue(node) {
            const enumType = linkables.getOrThrow([...stack.getPath(node.kind), node.enum]).type;
            assertIsNode(enumType, 'enumTypeNode');
            const variants = enumType.variants ?? [];
            const variantIndex = variants.findIndex(variant => variant.identifier === node.variant);
            if (variantIndex < 0) {
                throw new CodamaError(CODAMA_ERROR__ENUM_VARIANT_NOT_FOUND, {
                    enum: enumType,
                    enumName: node.enum.identifier,
                    variant: node.variant,
                });
            }
            const __discriminator = variants[variantIndex].discriminator ?? variantIndex;
            const value = { __discriminator, __kind: node.variant };
            return node.value === undefined ? value : { ...value, data: visit(node.value, this) };
        },
        visitFloatValue(node) {
            return Number(node.value);
        },
        visitInjectedValue(node) {
            return visit(scope.resolveOrThrow(node, { kinds: VALUE_NODE_KINDS }), this);
        },
        visitIntegerValue(node) {
            return BigInt(node.value);
        },
        visitMapValue(node) {
            return Object.fromEntries(
                (node.entries ?? []).map(entry => [visit(entry.key, this), visit(entry.value, this)] as const),
            ) as unknown;
        },
        visitNoneValue() {
            return { __option: 'None' };
        },
        visitPublicKeyValue(node) {
            return node.publicKey;
        },
        visitSetValue(node) {
            return (node.items ?? []).map(item => visit(item, this));
        },
        visitSomeValue(node) {
            return { __option: 'Some', value: visit(node.value, this) };
        },
        visitStringValue(node) {
            return node.string;
        },
        visitStructValue(node) {
            return Object.fromEntries((node.fields ?? []).map(field => [field.identifier, visit(field.value, this)]));
        },
        visitTupleValue(node) {
            return (node.items ?? []).map(item => visit(item, this));
        },
    };

    return pipe(baseVisitor, v => recordNodeStackVisitor(v, stack));
}
