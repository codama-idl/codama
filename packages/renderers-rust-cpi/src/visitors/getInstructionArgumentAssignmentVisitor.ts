import { CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, CodamaError } from '@codama/errors';
import { isNode, REGISTERED_TYPE_NODE_KINDS } from '@codama/nodes';
import { extendVisitor, pipe, staticVisitor, visit } from '@codama/visitors-core';

import type { ParsedInstructionArgument } from '../fragments';
import { addFragmentImports, Fragment, fragment } from '../utils';

export function getInstructionArgumentAssignmentVisitor(argument: ParsedInstructionArgument, offset: number) {
    return pipe(
        staticVisitor((): [Fragment, number] => [fragment``, 0], {
            keys: [...REGISTERED_TYPE_NODE_KINDS, 'definedTypeLinkNode'],
        }),
        v =>
            extendVisitor(v, {
                visitArrayType() {
                    return [fragment``, 0];
                },

                visitBooleanType() {
                    return [fragment``, 0];
                },

                visitBytesType() {
                    return [fragment``, 0];
                },

                visitDefinedTypeLink() {
                    return [fragment``, 0];
                },

                visitEnumEmptyVariantType() {
                    return [fragment``, 0];
                },

                visitEnumStructVariantType() {
                    return [fragment``, 0];
                },

                visitEnumTupleVariantType() {
                    return [fragment``, 0];
                },

                visitEnumType() {
                    return [fragment``, 0];
                },

                visitFixedSizeType(fixedSizeType, { self }) {
                    if (isNode(fixedSizeType.type, 'stringTypeNode')) {
                        let value: Fragment;
                        if (argument.defaultValue) {
                            value = fragment`&${argument.resolvedDefaultValue}`;
                        } else {
                            value = fragment`self.${argument.displayName}.as_ref()`;
                        }
                        return [
                            addFragmentImports(
                                fragment`write_bytes(&mut uninit_data[${offset}..${offset + argument.fixedSize!}], ${value});`,
                                ['super::write_bytes'],
                            ),
                            offset + argument.fixedSize!,
                        ];
                    }

                    return visit(fixedSizeType.type, self);
                },

                visitMapType() {
                    return [fragment``, 0];
                },

                visitNumberType(numberType) {
                    if (numberType.format === 'u8') {
                        let value: Fragment;
                        if (argument.defaultValue) {
                            value = fragment`${argument.resolvedDefaultValue}`;
                        } else {
                            value = fragment`self.${argument.displayName}`;
                        }
                        return [fragment`uninit_data[${offset}] = ${value};`, offset + 1];
                    } else {
                        let value: Fragment;
                        if (argument.defaultValue) {
                            value = fragment`${argument.resolvedDefaultValue}${numberType.format}`;
                        } else {
                            value = fragment`self.${argument.displayName}`;
                        }
                        return [
                            addFragmentImports(
                                fragment`write_bytes(&mut uninit_data[${offset}..${offset + argument.fixedSize!}], &${value}.to_le_bytes());`,
                                ['super::write_bytes'],
                            ),
                            offset + argument.fixedSize!,
                        ];
                    }
                },

                visitOptionType() {
                    return [fragment``, 0];
                },

                visitPublicKeyType() {
                    let value: Fragment;
                    if (argument.defaultValue) {
                        value = fragment`${argument.resolvedDefaultValue}`;
                    } else {
                        value = fragment`self.${argument.displayName}`;
                    }
                    return [
                        addFragmentImports(
                            fragment`write_bytes(&mut uninit_data[${offset}..${offset + argument.fixedSize!}], ${value}.as_ref());`,
                            ['super::write_bytes'],
                        ),
                        offset + argument.fixedSize!,
                    ];
                },

                visitRemainderOptionType(node) {
                    throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: node.kind, node });
                },

                visitSetType() {
                    return [fragment``, 0];
                },

                visitSizePrefixType() {
                    return [fragment``, 0];
                },

                visitStringType() {
                    return [fragment``, 0];
                },

                visitStructFieldType() {
                    return [fragment``, 0];
                },

                visitStructType() {
                    return [fragment``, 0];
                },

                visitTupleType() {
                    return [fragment``, 0];
                },

                visitZeroableOptionType(node) {
                    throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: node.kind, node });
                },
            }),
    );
}
