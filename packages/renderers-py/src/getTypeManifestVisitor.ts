import { CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, CodamaError } from '@codama/errors';
import {
    // CountNode,
    isNode,
    NumberTypeNode,
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

import { Fragment, fragment } from './fragments';
import { ImportMap } from './ImportMap';
import { TypeManifest, typeManifest } from './TypeManifest';
import { GetImportFromFunction, renderString } from './utils';
import { getBytesFromBytesValueNode } from './utils/codecs';

export type TypeManifestVisitor = ReturnType<typeof getTypeManifestVisitor>;

export function hexToPyB(hexStr: string): string {
    if (!hexStr || hexStr.length === 0) {
        return '';
    }

    try {
        const buffer: Buffer = Buffer.from(hexStr, 'hex');
        const hexFormat: string = Array.from(buffer)
            .map(byte => `\\x${byte.toString(16).padStart(2, '0')}`)
            .join('');
        return hexFormat;
    } catch {
        throw new Error(`Invalid hex string: ${hexStr}`);
    }
}

export function bytesToPyB(bytesArray: Uint8Array): string {
    if (!bytesArray || bytesArray.length === 0) {
        return '';
    }

    const hexFormat: string = Array.from(bytesArray)
        .map(byte => `\\x${byte.toString(16).padStart(2, '0')}`)
        .join('');
    return hexFormat;
}

export class GeneratedType {
    name: string;
    origin?: string;
    constructor(name: string, origin: string) {
        this.name = name;
        this.origin = origin;
    }
}
export function getTypeManifestVisitor(input: {
    genType: GeneratedType;
    getImportFrom: GetImportFromFunction;
    linkables: LinkableDictionary;
    stack?: NodeStack;
}) {
    const { linkables, genType } = input;
    const stack = input.stack ?? new NodeStack();
    let parentSize: NumberTypeNode | number | null = null;

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
                visitAmountType(amountType, { self }) {
                    return visit(amountType.number, self);
                },

                visitArrayType(arrayType, { self }) {
                    const itemlayout = visit(arrayType.item, self);
                    const imports = new ImportMap();
                    imports.mergeWith(itemlayout.borshType);
                    const inner = visit(arrayType.item, self);
                    let count = 0;
                    let toJSONStr = '';
                    let fromJSONStr = '';
                    let fromDecodeStr = '';
                    let toEncodeStr = '';
                    if (isNode(arrayType.count, 'fixedCountNode')) {
                        count = arrayType.count.value;
                        imports.mergeWith(inner.borshType);
                        if (inner.isEncodable) {
                            toEncodeStr = `list(map(lambda item:item.to_encodable(),{{name}}))`;
                            const toJSONItemStr = renderString(inner.toJSON.render, { name: 'item' });
                            toJSONStr = `list(map(lambda item:${toJSONItemStr},{{name}}))`;
                            const fromJSONItemStr = renderString(inner.fromJSON.render, { name: 'item' });
                            fromJSONStr = `list(map(lambda item:${fromJSONItemStr},{{name}}))`;
                            const fromDecodeItemStr = renderString(inner.fromDecode.render, { name: 'item' });
                            fromDecodeStr = `list(map(lambda item:${fromDecodeItemStr},{{name}}))`;
                        } else {
                            if (arrayType.item.kind == 'publicKeyTypeNode') {
                                const fromJSONItemStr = renderString(inner.fromJSON.render, { name: 'item' });
                                fromJSONStr = `list(map(lambda item:${fromJSONItemStr},{{name}}))`;
                                fromDecodeStr = `{{name}}`; //`list(map(lambda item:${fromDecodeItemStr},{{name}}))`;
                                const toJSONItemStr = renderString(inner.toJSON.render, { name: 'item' });
                                toJSONStr = `list(map(lambda item:${toJSONItemStr},{{name}}))`;
                                toEncodeStr = '{{name}}';
                            } else {
                                toEncodeStr = '{{name}}';
                                toJSONStr = '{{name}}';
                                fromJSONStr = '{{name}}';
                            }
                        }
                        return {
                            borshType: fragment(`${itemlayout.borshType.render}[${count}]`, imports),
                            fromDecode: fragment(fromDecodeStr, imports),
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
                        imports.add('construct', ['Construct', 'GreedyRange']);
                        if (inner.isEncodable) {
                            const fromJSONItemStr = renderString(inner.fromJSON.render, { name: 'item' });
                            fromJSONStr = `list(map(lambda item:${fromJSONItemStr},{{name}}))`;
                            const fromDecodeItemStr = renderString(inner.fromDecode.render, { name: 'item' });
                            fromDecodeStr = `list(map(lambda item:${fromDecodeItemStr},{{name}}))`;
                            toEncodeStr = `list(map(lambda item:item.to_encodable(),{{name}}))`;
                        }
                        return {
                            borshType: fragment(
                                `GreedyRange(typing.cast(Construct, ${itemlayout.borshType.render}))`,
                                imports,
                            ),
                            fromDecode: fragment(fromDecodeStr, imports),
                            fromJSON: fragment(fromJSONStr, imports),
                            isEncodable: false,
                            isEnum: false,
                            pyJSONType: fragment(`list[${inner.pyJSONType.render}]`, imports),
                            pyType: fragment(`list[${inner.pyType.render}]`, imports),
                            toEncode: fragment(toEncodeStr, imports),
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
                                case 'u128':
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
                    const pyBstr = hexToPyB(node.data);
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
                    let toJSONStr = '';
                    let isEnum = false;
                    let isEncodable = true;
                    const imports = new ImportMap();
                    if (genType.name != 'types') {
                        imports.add('..', 'types');
                    }
                    toJSONStr = '{{name}}.to_json()';
                    if (definedType.type.kind == 'enumTypeNode') {
                        pyTypeStr = `${modname}.${pascalCase(typename)}Kind`;
                        borshTypeStr = `${modname}.layout`;
                        fromJSONStr = `${modname}.from_json({{name}})`;
                        fromDecodeStr = `${modname}.from_decoded({{name}})`;
                        pyJSONTypeStr = `${modname}.${pascalCase(typename)}JSON`;

                        isEnum = true;
                    } else if (definedType.type.kind == 'structTypeNode') {
                        pyTypeStr = `${modname}.${pascalCase(typename)}`;
                        borshTypeStr = `${modname}.${pascalCase(typename)}.layout`;
                        fromJSONStr = `${modname}.${pascalCase(typename)}.from_json({{name}})`;
                        fromDecodeStr = `${modname}.${pascalCase(typename)}.from_decoded({{name}})`;
                        pyJSONTypeStr = `${modname}.${pascalCase(typename)}JSON`;
                    } else {
                        pyTypeStr = `${modname}.pyType`;
                        borshTypeStr = `${modname}.${pascalCase(typename)}`;
                        fromJSONStr = `{{name}}`;
                        fromDecodeStr = `{{name}}`;
                        pyJSONTypeStr = `${modname}.pyType`;
                        toJSONStr = '{{name}}';
                        isEncodable = false;
                    }
                    if (genType.name != 'types') {
                        pyTypeStr = 'types.' + pyTypeStr;
                        borshTypeStr = 'types.' + borshTypeStr;
                        fromJSONStr = 'types.' + fromJSONStr;
                        fromDecodeStr = 'types.' + fromDecodeStr;
                        pyJSONTypeStr = `types.${modname}.${pascalCase(typename)}JSON`;
                    } else {
                        imports.add('.', `${modname}`);
                    }

                    return {
                        borshType: fragment(borshTypeStr, imports),
                        fromDecode: fragment(fromDecodeStr, imports),
                        fromJSON: fragment(fromJSONStr, imports),
                        isEncodable: isEncodable,
                        isEnum: isEnum,
                        pyJSONType: fragment(pyJSONTypeStr, imports),
                        pyType: fragment(pyTypeStr, imports),
                        toEncode: fragment('{{name}}', imports),
                        toJSON: fragment(toJSONStr, imports),
                        value: fragment(''),
                    };
                },
                visitFixedSizeType(node) {
                    const imports = new ImportMap();
                    if (node.type.kind == 'bytesTypeNode') {
                        imports.add('..shared', 'FixedSizeBytes');
                        imports.add('construct', 'GreedyBytes');
                        return {
                            borshType: fragment(`FixedSizeBytes(${node.size},GreedyBytes)`, imports), //`borsh.U8[${node.size}]`),
                            fromDecode: fragment('{{name}}'),
                            fromJSON: fragment('bytes({{name}})'),
                            isEncodable: false,
                            isEnum: false,
                            pyJSONType: fragment('list[int]'),
                            pyType: fragment('bytes'),
                            toEncode: fragment('{{name}}'),
                            toJSON: fragment('list({{name}})'),
                            value: fragment(''),
                        };
                    } else if (node.type.kind == 'stringTypeNode') {
                        imports.add('..shared', 'FixedSizeString'); // PaddedString(20, "utf8")
                        return {
                            borshType: fragment(`FixedSizeString(${node.size},"utf8")`, imports),
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
                    throw new Error('Fixed type not supported by Borsh');
                },
                visitHiddenPrefixType(node, { self }) {
                    const imports = new ImportMap(); //.add('solders.pubkey', 'Pubkey');
                    const inner = visit(node.type, self);
                    imports.mergeWith(inner.borshType);
                    const prefix: Fragment[] = [];
                    imports.add('..shared', 'HiddenPrefixAdapter');

                    node.prefix.forEach(item => {
                        if (item.type.kind == 'stringTypeNode') {
                            if (item.value.kind == 'stringValueNode') {
                                imports.add('construct', 'Const');
                                const constRender = `Const("${item.value.string}".encode())`;
                                prefix.push(fragment(constRender, imports));
                                return;
                            }
                        } else if (item.type.kind == 'bytesTypeNode') {
                            if (item.value.kind == 'bytesValueNode') {
                                imports.add('construct', 'Const');
                                const bytes = getBytesFromBytesValueNode(item.value);
                                const constRender = `Const(b"${bytesToPyB(bytes)}"`;
                                prefix.push(fragment(constRender, imports));
                                return;
                            }
                        } else if (item.type.kind == 'preOffsetTypeNode') {
                            //todo preOffsetTypeNode
                            const itemType = visit(item.type, self);
                            imports.mergeWith(itemType.borshType);
                            const itemTypeRender = renderString(itemType.borshType.render, { subcon: inner.borshType });
                            if (item.value.kind == 'numberValueNode') {
                                imports.add('construct', 'Const');
                                const constRender = `Const(${item.value.number},${itemTypeRender})`;
                                prefix.push(fragment(constRender, imports));
                            }
                            return;
                        } else if (item.type.kind == 'numberTypeNode') {
                            imports.add('construct', 'Const');
                            const itemType = visit(item.type, self);
                            if (item.value.kind == 'numberValueNode') {
                                const numberRender = `Const(${item.value.number},${itemType.borshType.render})`;
                                prefix.push(fragment(numberRender, imports));
                            }
                            return;
                        }
                        throw new Error(`Unsupported ConstantValue Type: ${item.type.kind}`);
                    });

                    const borshTypeStr = `HiddenPrefixAdapter(borsh.TupleStruct(${prefix.join(',')}),${inner.borshType.render})`;
                    return {
                        borshType: fragment(borshTypeStr, imports),
                        fromDecode: fragment(inner.fromDecode.render, imports),
                        fromJSON: fragment(`${inner.fromJSON.render}`),
                        isEncodable: false,
                        isEnum: false,
                        pyJSONType: fragment(`${inner.pyJSONType.render}`),
                        pyType: fragment(`${inner.pyType.render}`, imports),
                        toEncode: fragment(`${inner.toEncode.render}`),
                        toJSON: fragment(`${inner.toJSON.render}`),
                        value: fragment(''),
                    };
                },

                visitHiddenSuffixType(node, { self }) {
                    const imports = new ImportMap(); //.add('solders.pubkey', 'Pubkey');
                    const inner = visit(node.type, self);
                    const suffix: Fragment[] = [];

                    imports.add('..shared', 'HiddenSuffixAdapter');

                    node.suffix.forEach(item => {
                        if (item.type.kind == 'stringTypeNode') {
                            if (item.value.kind == 'stringValueNode') {
                                //const strBs = getConstantEncoder(getUtf8Encoder().encode(item.value.string)).encode();
                                //suffix = mergeBytes([suffix, strBs.valueOf()]);
                                imports.add('construct', 'Const');
                                const constRender = `Const("${item.value.string}".encode())`;
                                suffix.push(fragment(constRender, imports));

                                return;
                            }
                        } else if (item.type.kind == 'bytesTypeNode') {
                            if (item.value.kind == 'bytesValueNode') {
                                imports.add('construct', 'Const');
                                const bytes = getBytesFromBytesValueNode(item.value);
                                const constRender = `Const(b"${bytesToPyB(bytes)}"`;
                                suffix.push(fragment(constRender, imports));

                                return;
                            }
                        } else if (item.type.kind == 'preOffsetTypeNode') {
                            const itemType = visit(item.type, self);
                            imports.mergeWith(itemType.borshType);
                            const itemTypeRender = renderString(itemType.borshType.render, { subcon: inner.borshType });
                            if (item.value.kind == 'numberValueNode') {
                                imports.add('construct', 'Const');
                                const constRender = `Const(${item.value.number},${itemTypeRender})`;
                                suffix.push(fragment(constRender, imports));
                            }

                            return;
                        } else if (item.type.kind == 'numberTypeNode') {
                            imports.add('construct', 'Const');
                            const itemType = visit(item.type, self);
                            if (item.value.kind == 'numberValueNode') {
                                const numberRender = `Const(${item.value.number},${itemType.borshType.render})`;
                                suffix.push(fragment(numberRender, imports));
                            }
                            return;
                        }
                        throw new Error(`Unsupported ConstantValue Type: ${item.type.kind}`);
                    });
                    const borshTypeStr = `HiddenSuffixAdapter(borsh.TupleStruct(${suffix.join(',')}),${inner.borshType.render})`;

                    return {
                        borshType: fragment(borshTypeStr, imports),
                        fromDecode: fragment('{{name}}', imports),
                        fromJSON: fragment(`${inner.fromJSON.render}`),
                        isEncodable: false,
                        isEnum: false,
                        pyJSONType: fragment(`${inner.pyJSONType.render}`),
                        pyType: fragment(`${inner.pyType.render}`, imports),
                        toEncode: fragment(`${inner.toEncode.render}`),
                        toJSON: fragment(`${inner.toJSON.render}`),
                        value: fragment(''),
                    };
                },
                visitMapEntryValue(node) {
                    throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: node.kind, node });
                },
                visitMapType(node, { self }) {
                    const imports = new ImportMap();
                    let borshTypeStr = '';
                    const innerKey = visit(node.key, self);
                    const innerValue = visit(node.value, self);

                    if (node.count.kind == 'prefixedCountNode') {
                        if (
                            node.count.prefix.kind == 'numberTypeNode' &&
                            node.count.prefix.format == 'u32' &&
                            node.count.prefix.endian == 'le'
                        ) {
                            borshTypeStr = `borsh.HashMap(${innerKey.borshType.render},${innerValue.borshType.render})`;
                        }
                    }
                    return {
                        borshType: fragment(borshTypeStr, imports),
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

                visitMapValue(node) {
                    throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: node.kind, node });
                },

                visitNumberType(numberType) {
                    if (numberType.endian !== 'le') {
                        throw new Error('Number endianness not supported by Borsh');
                    }
                    const imports = new ImportMap();

                    let borshTypeStr = '';
                    let pyJSONTypeStr = '';
                    let pyTypeStr = '';
                    switch (numberType.format) {
                        case 'u8':
                        case 'u16':
                        case 'u32':
                        case 'u64':
                        case 'u128':
                        case 'i8':
                        case 'i16':
                        case 'i32':
                        case 'i64':
                        case 'i128':
                            imports.addAlias('', 'borsh_construct', 'borsh');
                            imports.add('', 'borsh_construct');
                            borshTypeStr = NumberToBorshType(numberType.format);
                            pyJSONTypeStr = 'int';
                            pyTypeStr = 'int';
                            break;
                        case 'f32':
                            imports.add('construct', 'Float32l');
                            borshTypeStr = 'Float32l';
                            pyJSONTypeStr = 'float';
                            pyTypeStr = 'float';
                            break;
                        case 'f64':
                            imports.add('construct', 'Float64l');
                            borshTypeStr = 'Float64l';
                            pyJSONTypeStr = 'float';
                            pyTypeStr = 'float';
                            break;
                        default:
                            throw new Error(`Unsupported number type: ${numberType.format}`);
                    }
                    return {
                        borshType: fragment(borshTypeStr, imports),
                        fromDecode: fragment('{{name}}'),
                        fromJSON: fragment('{{name}}'),
                        isEncodable: false,
                        isEnum: false,
                        pyJSONType: fragment(pyJSONTypeStr),
                        pyType: fragment(pyTypeStr),
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
                    } else if (optionPrefix.format === 'u32' && optionPrefix.endian === 'le') {
                        const imports = new ImportMap();
                        imports.add('..shared', 'OptionU32');
                        const toJSONStr = `(None if {{name}} is None else ${inner.toJSON.render})`;
                        const fromJSONStr = `(None if {{name}} is None else ${inner.fromJSON.render})`;
                        const fromDecodeStr = `(None if {{name}} is None else ${inner.fromDecode.render})`;
                        let toEncodeStr = '';
                        if (inner.isEncodable) {
                            toEncodeStr = `(None if {{name}} is None else {{name}}.to_encodable())`;
                        } else {
                            toEncodeStr = '{{name}}';
                        }
                        imports.mergeWith(inner.borshType.imports);

                        return {
                            borshType: fragment(`OptionU32(${inner.borshType.render})`, imports),
                            fromDecode: fragment(fromDecodeStr, imports),
                            fromJSON: fragment(fromJSONStr, imports),
                            isEncodable: false,
                            isEnum: false,
                            pyJSONType: fragment(`typing.Optional[${inner.pyJSONType.render}]`, imports),
                            pyType: fragment(`typing.Optional[${inner.pyType.render}]`, imports),
                            toEncode: fragment(toEncodeStr),
                            toJSON: fragment(toJSONStr, imports),
                            value: fragment(''),
                        };
                    }

                    throw new Error(`Option size ${optionPrefix.format} not supported by Borsh`);
                },
                visitPostOffsetType(node, { self }) {
                    if (node.strategy != 'relative') {
                        throw new Error(`PostOffset type ${node.strategy} not supported by Borsh`);
                    }
                    const imports = new ImportMap();
                    imports.add('..shared', 'PostOffset');
                    const inner = visit(node.type, self);
                    const borshTypeStr = `PostOffset(${inner.borshType.render}, ${node.offset})`;
                    return {
                        borshType: fragment(borshTypeStr, imports),
                        fromDecode: fragment(inner.fromDecode.render, imports),
                        fromJSON: fragment(inner.fromJSON.render),
                        isEncodable: false,
                        isEnum: false,
                        pyJSONType: fragment(inner.pyJSONType.render),
                        pyType: fragment(inner.pyType.render, imports),
                        toEncode: fragment(inner.toEncode.render),
                        toJSON: fragment(inner.toJSON.render),
                        value: fragment(''),
                    };
                },
                visitPreOffsetType(node, { self }) {
                    const inner = visit(node.type, self);
                    const imports = new ImportMap();
                    imports.add('..shared', 'PreOffset');
                    const borshTypeStr = `PreOffset(${inner.borshType.render},${node.offset})`;
                    return {
                        borshType: fragment(borshTypeStr, imports),
                        fromDecode: fragment(inner.fromDecode.render, imports),
                        fromJSON: fragment(inner.fromJSON.render),
                        isEncodable: false,
                        isEnum: false,
                        pyJSONType: fragment(inner.pyJSONType.render),
                        pyType: fragment(inner.pyType.render, imports),
                        toEncode: fragment(inner.toEncode.render),
                        toJSON: fragment(inner.toJSON.render),
                        value: fragment(''),
                    };
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
                /*visitPublicKeyValue(node) {
                    const manifest = typeManifest();
                    manifest.value.setRender(`address("${node.publicKey}")`).addImports('solanaAddresses', 'address');
                    return manifest;
                    },*/
                visitRemainderOptionType(node, { self }) {
                    const inner = visit(node.item, self);
                    const imports = new ImportMap();
                    imports.add('..shared', 'RemainderOption');
                    const borshTypeStr = `RemainderOption(${inner.borshType.render})`;
                    imports.mergeWith(inner.borshType);
                    const fromDecodeStr = `(None if {{name}} is None else ${inner.fromDecode.render})`;

                    return {
                        borshType: fragment(borshTypeStr, imports),
                        fromDecode: fragment(fromDecodeStr, imports),
                        fromJSON: fragment(inner.fromJSON.render),
                        isEncodable: false,
                        isEnum: false,
                        pyJSONType: fragment('str'),
                        pyType: fragment(inner.pyType.render, imports),
                        toEncode: fragment(inner.toEncode.render),
                        toJSON: fragment('str({{name}})'),
                        value: fragment(''),
                    };
                },
                visitSetType(node) {
                    throw new CodamaError(CODAMA_ERROR__RENDERERS__UNSUPPORTED_NODE, { kind: node.kind, node });
                },

                visitSizePrefixType(sizePrefixType, { self }) {
                    parentSize = resolveNestedTypeNode(sizePrefixType.prefix);
                    const manifest = visit(sizePrefixType.type, self);
                    parentSize = null;
                    return manifest;
                },
                visitSolAmountType(amountType, { self }) {
                    return visit(amountType.number, self);
                },

                visitStringType() {
                    if (!parentSize) {
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
                    }
                    if (typeof parentSize === 'number') {
                        // todo
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
                    }
                    if (isNode(parentSize, 'numberTypeNode') && parentSize.endian === 'le') {
                        switch (parentSize.format) {
                            case 'u32':
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
                            case 'u8':
                            case 'u16':
                            case 'u64': {
                                const prefix = parentSize.format.toUpperCase();
                                const imports = new ImportMap();
                                imports.add('..shared', `String${prefix}`);

                                const borshType = `String${prefix}`;
                                return {
                                    borshType: fragment(borshType, imports),
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
                            }
                            default:
                                throw new Error(`'String size not supported: ${parentSize.format}`);
                        }
                    }
                    throw new Error('String size not supported by Borsh');
                },
                visitTupleType(tupleType, { self }) {
                    const imports = new ImportMap();
                    const items = tupleType.items.map(item => {
                        const itemType = visit(item, self);
                        imports.mergeWith(itemType.fromDecode);
                        return itemType;
                    });
                    const borshTypeStr = items.map((it, index) => `"item_${index}" / ${it.borshType.render}`).join(',');
                    const pyJSONTypeStr = items.map(it => `${it.pyJSONType.render}`).join(',');
                    const pyTypeStr = items.map(it => `${it.pyType.render}`).join(',');
                    const toJSONStr = items
                        .map((_it, index) => {
                            const innerDecodeItemStr = renderString(items[index].toJSON.render, {
                                name: `self.value[${index}]`,
                            });
                            return innerDecodeItemStr;
                        })
                        .join(',');
                    const fromJSONStr = items
                        .map((_it, index) => {
                            const innerStr = renderString(items[index].fromJSON.render, {
                                name: `{{name}}[${index}]`,
                            });
                            return innerStr;
                        })
                        .join(',');
                    const fromDecodeStr = items
                        .map((_it, index) => {
                            const innerDecodeItemStr = renderString(items[index].fromDecode.render, {
                                name: `{{name}}["item_${index}"]`,
                            });
                            return innerDecodeItemStr;
                            //return `{{name}}["item_${index}"]`).join(',');
                        })
                        .join(',');
                    const toEncodeStr = items
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
                        borshType: fragment(borshTypeStr, imports),
                        fromDecode: fragment(fromDecodeStr, imports),
                        fromJSON: fragment(fromJSONStr, imports),
                        isEncodable: false,
                        isEnum: false,
                        pyJSONType: fragment(pyJSONTypeStr, imports),
                        pyType: fragment(pyTypeStr, imports),
                        toEncode: fragment(toEncodeStr, imports),
                        toJSON: fragment(toJSONStr, imports),
                        value: fragment(''),
                    };
                },
                visitZeroableOptionType(node, { self }) {
                    const inner = visit(node.item, self);
                    const imports = new ImportMap();
                    imports.add('..shared', 'ZeroableOption');
                    let zeroValueStr = 'None';
                    if (node.zeroValue) {
                        if (node.zeroValue.kind == 'constantValueNode') {
                            imports.add('construct', 'Const');
                            //zeroValueStr = node.zeroValue.value;
                            if (node.zeroValue.type.kind == 'bytesTypeNode') {
                                //imports.add('..shared', 'None');
                                if (node.zeroValue.value.kind == 'bytesValueNode') {
                                    const bytes = getBytesFromBytesValueNode(node.zeroValue.value);
                                    zeroValueStr = `Const(b"${bytesToPyB(bytes)})"`;
                                }
                            }
                        }
                    }
                    let itemTypeStr = '';
                    if (node.item.kind == 'numberTypeNode') {
                        itemTypeStr = node.item.format;
                    } else if (node.item.kind == 'publicKeyTypeNode') {
                        itemTypeStr = 'publicKey';
                    }
                    const borshType = `ZeroableOption(${inner.borshType.render},${zeroValueStr},"${itemTypeStr}")`;
                    imports.mergeWith(inner.borshType);
                    const fromDecodeStr = `${inner.fromDecode.render}`;
                    const fromJSONStr = `${inner.fromJSON.render}`;
                    const pyJSONTypeStr = `${inner.pyJSONType.render}`;
                    const pyTypeStr = `${inner.pyType.render}`;
                    const toEncodeStr = `${inner.toEncode.render}`;
                    const toJSONStr = `${inner.toJSON.render}`;
                    return {
                        borshType: fragment(borshType, imports),
                        fromDecode: fragment(fromDecodeStr, imports),
                        fromJSON: fragment(fromJSONStr, imports),
                        isEncodable: false,
                        isEnum: false,
                        pyJSONType: fragment(pyJSONTypeStr),
                        pyType: fragment(pyTypeStr),
                        toEncode: fragment(toEncodeStr),
                        toJSON: fragment(toJSONStr),

                        value: fragment(''),
                    };
                },
            }),
        visitor => recordNodeStackVisitor(visitor, stack),
    );
}

function NumberToBorshType(format: string) {
    return 'borsh.' + format.toUpperCase();
}
