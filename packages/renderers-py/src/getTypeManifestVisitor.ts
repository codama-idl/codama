import { CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, CodamaError } from '@codama/errors';
import {
    // CountNode,
    isNode,
    pascalCase,
    REGISTERED_TYPE_NODE_KINDS,
    REGISTERED_VALUE_NODE_KINDS,
    resolveNestedTypeNode,
} from '@codama/nodes';
import {
    extendVisitor,
    getLastNodeFromPath,
    LinkableDictionary,
    NodeStack,
    pipe,
    recordNodeStackVisitor,
    staticVisitor,
    visit,
} from '@codama/visitors-core';
import { ReadonlyUint8Array } from '@solana/codecs-core';

import { fragment } from './fragments';
import { ImportMap } from './ImportMap';
import { TypeManifest, typeManifest } from './TypeManifest';
import { GetImportFromFunction, renderString } from './utils';

export type TypeManifestVisitor = ReturnType<typeof getTypeManifestVisitor>;

export function HexToPyB(hexStr: string) {
    const buffer: Buffer = Buffer.from(hexStr, 'hex');
    const xFormat: string = Array.from(buffer)
        .map(byte => `\\x${byte.toString(16).padStart(2, '0')}`)
        .join('');
    return xFormat;
}
export function BytesToPyB(bs: ReadonlyUint8Array) {
    const xFormat: string = Array.from(bs)
        .map(byte => `\\x${byte.toString(16).padStart(2, '0')}`)
        .join('');
    return xFormat;
}

export class GenType {
    name: string;
    origin?: string;
    constructor(name: string, origin: string) {
        this.name = name;
        this.origin = origin;
    }
}
export function getTypeManifestVisitor(input: {
    genType: GenType;
    getImportFrom: GetImportFromFunction;
    linkables: LinkableDictionary;
    stack?: NodeStack;
}) {
    //const { customAccountData } = input;
    const { linkables, genType } = input;
    const stack = input.stack ?? new NodeStack();
    //let parentName: { loose: string; strict: string } | null = null;

    return pipe(
        staticVisitor(
            () =>
                ({
                    borshType: fragment(''),
                    fromDecode: fragment(''),
                    fromJSON: fragment('{{name}}'),
                    isEnum: false,
                    pyType: fragment(''),
                    toJSON: fragment(''),
                    value: fragment(''),
                }) as TypeManifest,
            {
                keys: [
                    ...REGISTERED_TYPE_NODE_KINDS,
                    ...REGISTERED_VALUE_NODE_KINDS,
                    'definedTypeLinkNode',
                    'definedTypeNode',
                    'accountNode',
                    'instructionNode',
                ],
            },
        ),
        visitor =>
            extendVisitor(visitor, {
                visitAccount(account, { self }) {
                    const manifest = visit(account.data, self);
                    return manifest;
                },

                /*visitAmountType(amountType, { self }) {
                    return visit(amountType.number, self);
                    },*/

                visitArrayType(arrayType, { self }) {
                    const itemlayout = visit(arrayType.item, self);
                    const imports = new ImportMap();
                    const inner = visit(arrayType.item, self);
                    let count = 0;
                    let toJSONStr = '';
                    let fromJSONStr = '';
                    if (isNode(arrayType.count, 'fixedCountNode')) {
                        count = arrayType.count.value;
                        imports.mergeWith(inner.borshType);
                        let toEncodeStr = '';
                        if (inner.isEncodable) {
                            toEncodeStr = `list(map(lambda item:item.to_encodable(),{{name}}))`;
                            const toJSONItemStr = renderString(inner.toJSON.render, { name: 'item' });
                            toJSONStr = `list(map(lambda item:${toJSONItemStr},{{name}}))`;
                            const fromJSONItemStr = renderString(inner.fromJSON.render, { name: 'item' });
                            fromJSONStr = `list(map(lambda item:${fromJSONItemStr},{{name}}))`;
                        } else {
                            if (arrayType.item.kind == 'publicKeyTypeNode') {
                                const fromJSONItemStr = renderString(inner.fromJSON.render, { name: 'item' });
                                fromJSONStr = `list(map(lambda item:${fromJSONItemStr},{{name}}))`;
                                const toJSONItemStr = renderString(inner.toJSON.render, { name: 'item' });
                                toJSONStr = `list(map(lambda item:${toJSONItemStr},{{name}}))`;
                            } else {
                                toEncodeStr = '{{name}}';
                                toJSONStr = '{{name}}';
                                fromJSONStr = '{{name}}';
                            }
                        }
                        return {
                            borshType: fragment(`${itemlayout.borshType.render}[${count}]`, imports),
                            fromDecode: fragment(fromJSONStr, imports),
                            fromJSON: fragment(fromJSONStr, imports),
                            isEncodable: false,
                            isEnum: false,
                            pyJSONType: fragment(`list[${inner.pyJSONType.render}]`, imports),
                            pyType: fragment(`list[${inner.pyType.render}]`, imports),
                            toEncode: fragment(toEncodeStr, imports),
                            toJSON: fragment(toJSONStr, imports),
                            value: fragment(''),
                        };
                    } else if (isNode(arrayType.count, 'remainderCountNode')) {
                        return {
                            borshType: fragment(
                                `borsh.Vec(typing.cast(Construct, ${itemlayout.borshType.render}))`,
                                imports,
                            ),
                            fromDecode: fragment(fromJSONStr, imports),
                            fromJSON: fragment(fromJSONStr, imports),
                            isEncodable: false,
                            isEnum: false,
                            pyJSONType: fragment(`list[${inner.pyJSONType.render}]`, imports),
                            pyType: fragment(`list[${inner.pyType.render}]`, imports),
                            toEncode: fragment('', imports),
                            toJSON: fragment(toJSONStr, imports),
                            value: fragment(''),
                        };
                    } else {
                        const prefix = resolveNestedTypeNode(arrayType.count.prefix);
                        if (prefix.endian === 'le') {
                            switch (prefix.format) {
                                case 'u32':
                                case 'u8':
                                case 'u16':
                                case 'u64':
                                case 'shortU16': {
                                    imports.mergeWith(inner.borshType);
                                    imports.add('construct', 'Construct');
                                    let toEncodeStr = '';
                                    if (inner.isEncodable) {
                                        const toJSONItemStr = renderString(inner.toJSON.render, { name: 'item' });
                                        toJSONStr = `list(map(lambda item:${toJSONItemStr},{{name}}))`;
                                        const fromJSONItemStr = renderString(inner.fromJSON.render, { name: 'item' });
                                        fromJSONStr = `list(map(lambda item:${fromJSONItemStr},{{name}}))`;
                                        toEncodeStr = `list(map(lambda item:item.to_encodable(),{{name}}))`;
                                    } else {
                                        if (arrayType.item.kind == 'publicKeyTypeNode') {
                                            const fromJSONItemStr = renderString(inner.fromJSON.render, {
                                                name: 'item',
                                            });
                                            fromJSONStr = `list(map(lambda item:${fromJSONItemStr},{{name}}))`;
                                            const toJSONItemStr = renderString(inner.toJSON.render, { name: 'item' });
                                            toJSONStr = `list(map(lambda item:${toJSONItemStr},{{name}}))`;
                                        } else {
                                            toEncodeStr = '{{name}}';
                                            toEncodeStr = '{{name}}';
                                            toJSONStr = '{{name}}';
                                            fromJSONStr = '{{name}}';
                                        }
                                    }
                                    return {
                                        borshType: fragment(
                                            `borsh.Vec(typing.cast(Construct, ${itemlayout.borshType.render}))`,
                                            imports,
                                        ),
                                        fromDecode: fragment(fromJSONStr, imports),
                                        fromJSON: fragment(fromJSONStr, imports),
                                        isEncodable: false,
                                        isEnum: false,
                                        pyJSONType: fragment(`list[${inner.pyJSONType.render}]`, imports),
                                        pyType: fragment(`list[${inner.pyType.render}]`, imports),
                                        toEncode: fragment(toEncodeStr, imports),
                                        toJSON: fragment(toJSONStr, imports),
                                        value: fragment(''),
                                    };
                                }
                                default:
                                    throw new Error(`Array prefix not supported: ${prefix.format}`);
                            }
                        }
                        // TODO: Add to the Rust validator.
                        throw new Error('Array size not supported by Borsh');
                    }
                },

                visitBooleanType(booleanType) {
                    const resolvedSize = resolveNestedTypeNode(booleanType.size);
                    if (resolvedSize.format === 'u8' && resolvedSize.endian === 'le') {
                        return {
                            borshType: fragment('borsh.Bool'),
                            fromDecode: fragment('{{name}}'),
                            fromJSON: fragment('{{name}}'),
                            isEncodable: false,
                            isEnum: false,
                            pyJSONType: fragment('bool'),
                            pyType: fragment('bool'),
                            toEncode: fragment(`{{name}}`),
                            toJSON: fragment('{{name}}'),
                            value: fragment(''),
                        };
                    }
                    throw new Error('Bool size not supported by Borsh');
                },
                visitBooleanValue(node) {
                    const manifest = typeManifest();
                    manifest.value.setRender(JSON.stringify(node.boolean));
                    return manifest;
                },

                visitBytesType() {
                    return {
                        borshType: fragment('borsh.Bytes'),
                        fromDecode: fragment('{{name}}'),
                        fromJSON: fragment('{{name}}'),
                        isEncodable: false,
                        isEnum: false,
                        pyJSONType: fragment('list[int]'),
                        pyType: fragment('borsh.Bytes'),
                        toEncode: fragment(`{{name}}`),
                        toJSON: fragment('{{name}}'),
                        value: fragment(''),
                    };
                },

                visitBytesValue(node) {
                    const manifest = typeManifest();
                    const pyBstr = HexToPyB(node.data);
                    manifest.value.setRender(`b"${pyBstr}"`);
                    return manifest;
                },

                visitDefinedType(definedType, { self }) {
                    const manifest = visit(definedType.type, self);
                    return manifest;
                },
                visitDefinedTypeLink(node) {
                    const definedTypePath = linkables.getPathOrThrow(stack.getPath('definedTypeLinkNode'));
                    const definedType = getLastNodeFromPath(definedTypePath);
                    const typename = node.name;
                    const modname = node.name;
                    let pyTypeStr = '';
                    let borshTypeStr = '';
                    let fromJSONStr = '';
                    let pyJSONTypeStr = '';
                    let fromDecodeStr = '';
                    let isEnum = false;
                    const imports = new ImportMap();
                    if (genType.name != 'types') {
                        imports.add('..', 'types');
                    }
                    if (definedType.type.kind == 'enumTypeNode') {
                        pyTypeStr = `${modname}.${pascalCase(typename)}Kind`;
                        borshTypeStr = `${modname}.layout`;
                        fromJSONStr = `${modname}.from_json({{name}})`;
                        fromDecodeStr = `${modname}.from_decoded({{name}})`;
                        pyJSONTypeStr = `${modname}.${pascalCase(typename)}JSON`;

                        isEnum = true;
                    } else {
                        pyTypeStr = `${modname}.${pascalCase(typename)}`;
                        borshTypeStr = `${modname}.${pascalCase(typename)}.layout`;
                        fromJSONStr = `${modname}.${pascalCase(typename)}.from_json({{name}})`;
                        fromDecodeStr = `${modname}.${pascalCase(typename)}.from_decoded({{name}})`;
                        pyJSONTypeStr = `${modname}.${pascalCase(typename)}JSON`;
                    }
                    if (genType.name != 'types') {
                        pyTypeStr = 'types.' + pyTypeStr;
                        borshTypeStr = 'types.' + borshTypeStr;
                        fromJSONStr = 'types.' + fromJSONStr;
                        fromDecodeStr = 'types.' + fromJSONStr;
                        pyJSONTypeStr = `types.${modname}.${pascalCase(typename)}JSON`;
                    } else {
                        imports.add('.', `${modname}`);
                    }

                    return {
                        borshType: fragment(borshTypeStr, imports),
                        fromDecode: fragment(fromDecodeStr, imports),
                        fromJSON: fragment(fromJSONStr, imports),
                        isEncodable: true,
                        isEnum: isEnum,
                        pyJSONType: fragment(pyJSONTypeStr, imports),
                        pyType: fragment(pyTypeStr, imports),
                        toEncode: fragment('{{name}}', imports),
                        toJSON: fragment('{{name}}.to_json()', imports),
                        value: fragment(''),
                    };
                },
                visitFixedSizeType(node) {
                    if (node.type.kind == 'bytesTypeNode') {
                        return {
                            borshType: fragment(`borsh.U8[${node.size}]`),
                            fromDecode: fragment('{{name}}'),
                            fromJSON: fragment('{{name}}'),
                            isEncodable: false,
                            isEnum: false,
                            pyJSONType: fragment('list[int]'),
                            pyType: fragment('list[int]'),
                            toEncode: fragment('{{name}}'),
                            toJSON: fragment('{{name}}'),
                            value: fragment(''),
                        };
                    }
                    // TODO: Add to the Rust validator.
                    throw new Error('Fixed type not supported by Borsh');
                },
                visitMapEntryValue(node) {
                    throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: node.kind, node });
                },

                visitMapValue(node) {
                    throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: node.kind, node });
                },
                visitNumberType(numberType) {
                    if (numberType.endian !== 'le') {
                        // TODO: Add to the Rust validator.
                        throw new Error('Number endianness not supported by Borsh');
                    }
                    return {
                        borshType: fragment(NumberToBorshType(numberType.format)),
                        fromDecode: fragment('{{name}}'),
                        fromJSON: fragment('{{name}}'),
                        isEncodable: false,
                        isEnum: false,
                        pyJSONType: fragment('int'),
                        pyType: fragment('int'),
                        toEncode: fragment('{{name}}'),
                        toJSON: fragment('{{name}}'),
                        value: fragment(''),
                    };
                },

                visitNumberValue(node) {
                    const manifest = typeManifest();
                    manifest.value.setRender(JSON.stringify(node.number));
                    return manifest;
                },

                visitOptionType(optionType, { self }) {
                    const inner = visit(optionType.item, self);
                    const optionPrefix = resolveNestedTypeNode(optionType.prefix);
                    if (optionPrefix.format === 'u8' && optionPrefix.endian === 'le') {
                        const toJSONStr = `(None if {{name}} is None else ${inner.toJSON.render})`;

                        const fromJSONStr = `(None if {{name}} is None else ${inner.fromJSON.render})`;
                        const fromDecodeStr = `(None if {{name}} is None else ${inner.fromDecode.render})`;

                        let toEncodeStr = '';
                        if (inner.isEncodable) {
                            toEncodeStr = `(None if {{name}} is None else {{name}}.to_encodable())`;
                        } else {
                            toEncodeStr = '{{name}}';
                        }

                        return {
                            borshType: fragment(`borsh.Option(${inner.borshType.render})`, inner.borshType.imports),
                            fromDecode: fragment(fromDecodeStr, inner.fromJSON.imports),
                            fromJSON: fragment(fromJSONStr, inner.fromJSON.imports),
                            isEncodable: false,
                            isEnum: false,
                            pyJSONType: fragment(
                                `typing.Optional[${inner.pyJSONType.render}]`,
                                inner.pyJSONType.imports,
                            ),
                            pyType: fragment(`typing.Optional[${inner.pyType.render}]`, inner.pyType.imports),
                            toEncode: fragment(toEncodeStr),
                            toJSON: fragment(toJSONStr, inner.toJSON.imports),
                            value: fragment(''),
                        };
                    }

                    // TODO: Add to the Rust validator.
                    throw new Error('Option size not supported by Borsh');
                },
                visitPublicKeyType() {
                    const imports = new ImportMap().add('solders.pubkey', 'Pubkey');
                    imports.addAlias('solders.pubkey', 'Pubkey', 'SolPubkey');
                    imports.add('anchorpy.borsh_extension', 'BorshPubkey');
                    return {
                        borshType: fragment('BorshPubkey', imports),
                        fromDecode: fragment('{{name}}', imports),
                        fromJSON: fragment('SolPubkey.from_string({{name}})'),
                        isEncodable: false,
                        isEnum: false,
                        pyJSONType: fragment('str'),
                        pyType: fragment('SolPubkey', imports),
                        toEncode: fragment('{{name}}'),
                        toJSON: fragment('str({{name}})'),
                        value: fragment(''),
                    };
                },

                visitPublicKeyValue(node) {
                    const manifest = typeManifest();
                    manifest.value.setRender(`address("${node.publicKey}")`).addImports('solanaAddresses', 'address');
                    return manifest;
                },
                visitRemainderOptionType(node) {
                    throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: node.kind, node });
                },
                visitSetType(node) {
                    throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: node.kind, node });
                },

                visitSizePrefixType(sizePrefixType) {
                    const parentSize = resolveNestedTypeNode(sizePrefixType.prefix);
                    const imports = new ImportMap(); //.add('solders.pubkey', 'Pubkey');
                    //console.log('visitSizePrefixType', parentSize);
                    if (parentSize.kind == 'numberTypeNode') {
                        if (parentSize.format == 'u64' && parentSize.endian == 'le') {
                            imports.add('..shared', 'String64');
                            return {
                                borshType: fragment('String64', imports),
                                fromDecode: fragment('{{name}}'),
                                fromJSON: fragment('{{name}}'),
                                isEncodable: false,
                                isEnum: false,
                                pyJSONType: fragment('str'),
                                pyType: fragment('str'),
                                toEncode: fragment('{{name}}'),
                                toJSON: fragment('{{name}}'),
                                value: fragment(''),
                            };
                        } else if (parentSize.format == 'u32' && parentSize.endian == 'le') {
                            return {
                                borshType: fragment('borsh.String'),
                                fromDecode: fragment('{{name}}'),
                                fromJSON: fragment('{{name}}'),
                                isEncodable: false,
                                isEnum: false,
                                pyJSONType: fragment('str'),
                                pyType: fragment('str'),
                                toEncode: fragment('{{name}}'),
                                toJSON: fragment('{{name}}'),
                                value: fragment(''),
                            };
                        } else {
                            throw new Error(`'String size not supported: ${parentSize.format}`);
                        }
                    }

                    // TODO: Add to the Rust validator.
                    throw new Error('String size not supported by Borsh');
                },

                visitStringType(_node) {
                    return {
                        borshType: fragment('borsh.String'),
                        fromDecode: fragment('{{name}}'),
                        fromJSON: fragment('{{name}}'),
                        isEncodable: false,
                        isEnum: false,
                        pyJSONType: fragment('str'),
                        pyType: fragment('borsh.String'),
                        toEncode: fragment('{{name}}'),
                        toJSON: fragment('{{name}}'),

                        value: fragment(''),
                    };
                },
                visitTupleType(tupleType, { self }) {
                    const imports = new ImportMap(); //.add('solders.pubkey', 'Pubkey');
                    const items = tupleType.items.map(item => {
                        const itemType = visit(item, self);
                        imports.mergeWith(itemType.fromDecode);
                        return itemType;
                    });
                    const borshTypestr = items.map((it, index) => `"item_${index}" / ${it.borshType.render}`).join(',');
                    const pyJSONType = items.map(it => `${it.pyJSONType.render}`).join(',');
                    const pyType = items.map(it => `${it.pyType.render}`).join(',');
                    const toJSON = items
                        .map((_it, index) => {
                            const innerDecodeItemStr = renderString(items[index].toJSON.render, {
                                name: `self.value[${index}]`,
                            });
                            return innerDecodeItemStr;
                        })
                        .join(',');
                    const fromJSON = items
                        .map((_it, index) => {
                            const innerStr = renderString(items[index].fromJSON.render, {
                                name: `{{name}}[${index}]`,
                            });
                            return innerStr;
                        })
                        .join(',');
                    const fromDecode = items
                        .map((_it, index) => {
                            const innerDecodeItemStr = renderString(items[index].fromDecode.render, {
                                name: `{{name}}["item_${index}"]`,
                            });
                            return innerDecodeItemStr;
                            //return `{{name}}["item_${index}"]`).join(',');
                        })
                        .join(',');
                    const toEncode = items
                        .map((_it, index) => {
                            let innerStr = '';
                            if (items[index].isEncodable) {
                                innerStr = renderString(items[index].toEncode.render, {
                                    name: `self.value[${index}].to_encodable()`,
                                });
                            } else {
                                innerStr = renderString(items[index].toEncode.render, {
                                    name: `self.value[${index}]`,
                                });
                            }
                            return `"item_${index}":` + innerStr;
                        })
                        .join(',');
                    return {
                        borshType: fragment(borshTypestr, imports),
                        fromDecode: fragment(fromDecode, imports),
                        fromJSON: fragment(fromJSON, imports),
                        isEncodable: false,
                        isEnum: false,
                        pyJSONType: fragment(pyJSONType, imports),
                        pyType: fragment(pyType, imports),
                        toEncode: fragment(toEncode, imports),
                        toJSON: fragment(toJSON, imports),
                        value: fragment(''),
                    };
                },
                visitZeroableOptionType(node) {
                    throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: node.kind, node });
                },
            }),
        visitor => recordNodeStackVisitor(visitor, stack),
    );
}

function NumberToBorshType(format: string) {
    return 'borsh.' + format.toUpperCase();
}
