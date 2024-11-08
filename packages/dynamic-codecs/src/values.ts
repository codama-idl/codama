import { CODAMA_ERROR__ENUM_VARIANT_NOT_FOUND, CodamaError } from '@codama/errors';
import { assertIsNode, bytesTypeNode, isNode, isScalarEnum, pascalCase, ValueNode } from '@codama/nodes';
import { LinkableDictionary, NodeStack, pipe, recordNodeStackVisitor, visit, Visitor } from '@codama/visitors-core';

import { CodecVisitorOptions, getNodeCodecVisitor } from './codecs';

export function getValueNodeVisitor(
    linkables: LinkableDictionary,
    options: {
        codecVisitorFactory?: () => ReturnType<typeof getNodeCodecVisitor>;
        codecVisitorOptions?: CodecVisitorOptions;
        stack?: NodeStack;
    } = {},
): Visitor<unknown, ValueNode['kind']> {
    const stack = options.stack ?? new NodeStack();
    let cachedCodecVisitor: ReturnType<typeof getNodeCodecVisitor> | null = null;
    const codecVisitorFactory =
        options.codecVisitorFactory ??
        (() => (cachedCodecVisitor ??= getNodeCodecVisitor(linkables, { stack, ...options.codecVisitorOptions })));

    const baseVisitor: Visitor<unknown, ValueNode['kind']> = {
        visitArrayValue(node) {
            return node.items.map(item => visit(item, this));
        },
        visitBooleanValue(node) {
            return node.boolean;
        },
        visitBytesValue(node) {
            return [node.encoding, node.data];
        },
        visitConstantValue(node) {
            const codec = visit(node.type, codecVisitorFactory());
            const value = visit(node.value, this);
            const bytes = codec.encode(value);
            const bytesCodec = visit(bytesTypeNode(), codecVisitorFactory());
            return bytesCodec.decode(bytes);
        },
        visitEnumValue(node) {
            const enumType = linkables.getOrThrow([...stack.getPath(node.kind), node.enum]).type;
            assertIsNode(enumType, 'enumTypeNode');
            const variantIndex = enumType.variants.findIndex(variant => variant.name === node.variant);
            if (variantIndex < 0) {
                throw new CodamaError(CODAMA_ERROR__ENUM_VARIANT_NOT_FOUND, {
                    enum: node.enum,
                    enumName: node.enum.name,
                    variant: node.variant,
                });
            }
            const variant = enumType.variants[variantIndex];
            if (isScalarEnum(enumType)) return variantIndex;
            const kind = { __kind: pascalCase(node.variant) };
            if (isNode(variant, 'enumEmptyVariantTypeNode')) return kind;
            if (isNode(variant, 'enumStructVariantTypeNode') && !!node.value) {
                const value = visit(node.value, this) as object;
                return { ...kind, ...value };
            }
            if (isNode(variant, 'enumTupleVariantTypeNode') && !!node.value) {
                const fields = visit(node.value, this);
                return { ...kind, fields };
            }
            return kind;
        },
        visitMapValue(node) {
            return Object.fromEntries(
                node.entries.map(entry => {
                    const key = visit(entry.key, this);
                    const value = visit(entry.value, this);
                    return [key, value];
                }),
            );
        },
        visitNoneValue() {
            return { __option: 'None' };
        },
        visitNumberValue(node) {
            return node.number;
        },
        visitPublicKeyValue(node) {
            return node.publicKey;
        },
        visitSetValue(node) {
            return node.items.map(item => visit(item, this));
        },
        visitSomeValue(node) {
            const value = visit(node.value, this);
            return { __option: 'Some', value };
        },
        visitStringValue(node) {
            return node.string;
        },
        visitStructValue(node) {
            return Object.fromEntries(
                node.fields.map(field => {
                    const name = field.name;
                    const value = visit(field.value, this);
                    return [name, value];
                }),
            );
        },
        visitTupleValue(node) {
            return node.items.map(item => visit(item, this));
        },
    };

    return pipe(baseVisitor, v => recordNodeStackVisitor(v, stack));
}
