import {
    // CountNode,
    isNode,
    pascalCase,
    REGISTERED_TYPE_NODE_KINDS,
    REGISTERED_VALUE_NODE_KINDS,
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

import { fragment } from './fragments';
import { ImportMap } from './ImportMap';
import { mergeManifests, TypeManifest, typeManifest } from './TypeManifest';
import { GetImportFromFunction, renderString } from './utils';

export type TypeManifestVisitor = ReturnType<typeof getTypeManifestVisitor>;

export function HexToPyB(hexStr: string) {
    const buffer: Buffer = Buffer.from(hexStr, 'hex');
    const xFormat: string = Array.from(buffer)
        .map(byte => `\\x${byte.toString(16).padStart(2, '0')}`)
        .join('');
    return xFormat;
}

export class GenType {
    name: string;
    constructor(name: string) {
        this.name = name;
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
                    fromJSON: fragment('{{name}}'),
                    isEnum: false,
                    pyType: fragment(''),
                    strictType: fragment(''),
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
                    //const cast_layout = `typing.cast(Construct, ${itemlayout.borshType.render})`;
                    const inner = visit(arrayType.item, self);
                    //console.log("visitArrayType:",arrayType,self);
                    let count = 0;
                    if (isNode(arrayType.count, 'fixedCountNode')) {
                        count = arrayType.count.value;
                    }
                    const toJSONItemStr = renderString(inner.toJSON.render, { name: 'item' });
                    const toJSONStr = `list(map(lambda item:${toJSONItemStr},{{name}}))`;
                    const fromJSONItemStr = renderString(inner.fromJSON.render, { name: 'item' });
                    const fromJSONStr = `list(map(lambda item:${fromJSONItemStr},{{name}}))`;
                    return {
                        borshType: fragment(`${itemlayout.borshType.render}[${count}]`),
                        fromJSON: fragment(fromJSONStr),
                        isEnum: false,
                        pyJSONType: fragment(`list[${inner.pyJSONType.render}]`),
                        pyType: fragment(`list[${inner.pyType.render}]`),
                        strictType: fragment('boolean'),
                        toJSON: fragment(toJSONStr),
                        value: fragment(''),
                    };
                },

                visitArrayValue(node, { self }) {
                    return mergeManifests(
                        node.items.map(v => visit(v, self)),
                        { mergeValues: renders => `[${renders.join(', ')}]` },
                    );
                },
                visitBooleanType(_booleanType) {
                    return {
                        borshType: fragment('borsh.Bool'),
                        fromJSON: fragment('{{name}}'),
                        isEnum: false,
                        pyJSONType: fragment('bool'),
                        pyType: fragment('bool'),
                        strictType: fragment('boolean'),
                        toJSON: fragment('{{name}}'),
                        value: fragment(''),
                    };
                },
                visitBooleanValue(node) {
                    const manifest = typeManifest();
                    manifest.value.setRender(JSON.stringify(node.boolean));
                    return manifest;
                },

                visitBytesType() {
                    return {
                        borshType: fragment('borsh.Bytes'),
                        fromJSON: fragment('{{name}}'),
                        isEnum: false,
                        pyJSONType: fragment('list[int]'),
                        pyType: fragment('borsh.Bytes'),
                        strictType: fragment('ReadonlyUint8Array').addImports(
                            'solanaCodecsCore',
                            'type ReadonlyUint8Array',
                        ),
                        toJSON: fragment('{{name}}'),
                        value: fragment(''),
                    };
                },

                visitBytesValue(node) {
                    const manifest = typeManifest();
                    const pyBstr = HexToPyB(node.data);
                    manifest.value.setRender(`b"${pyBstr}"`);
                    //manifest.value.
                    return manifest;
                },

                visitDateTimeType(dateTimeType, { self }) {
                    return visit(dateTimeType.number, self);
                },

                visitDefinedType(definedType, { self }) {
                    /*parentName = {
                        loose: nameApi.dataArgsType(definedType.name),*/
                    const manifest = visit(definedType.type, self);
                    //parentName = null;
                    return manifest;
                },
                visitDefinedTypeLink(node) {
                    console.log('link parentName:', genType.name);
                    if (genType.name == 'account') {
                        console.log('visitDefinedTypeLink account');
                    } else {
                        console.log('visitDefinedTypeLink field');
                    }
                    const definedTypePath = linkables.getPathOrThrow(stack.getPath('definedTypeLinkNode'));
                    const definedType = getLastNodeFromPath(definedTypePath);
                    const typename = node.name;
                    const modname = node.name;
                    let pyTypeStr = '';
                    let borshTypeStr = '';
                    let fromJSONStr = '';
                    let pyJSONTypeStr = '';
                    let isEnum = false;
                    const imports = new ImportMap();
                    if (genType.name != 'types') {
                        imports.add('..', 'types');
                    }
                    if (definedType.type.kind == 'enumTypeNode') {
                        pyTypeStr = `${modname}.${pascalCase(typename)}Kind`;
                        borshTypeStr = `${modname}.layout`;
                        fromJSONStr = `${modname}.from_json({{name}})`;
                        isEnum = true;
                    } else {
                        pyTypeStr = `${modname}.${pascalCase(typename)}`;
                        borshTypeStr = `${modname}.${pascalCase(typename)}.layout`;
                        fromJSONStr = `${modname}.${pascalCase(typename)}.from_json({{name}})`;
                        pyJSONTypeStr = `${modname}.${pascalCase(typename)}JSON`;
                    }
                    if (genType.name != 'types') {
                        pyTypeStr = 'types.' + pyTypeStr;
                        borshTypeStr = 'types.' + borshTypeStr;
                        fromJSONStr = 'types.' + fromJSONStr;
                        pyJSONTypeStr = `types.${modname}.${pascalCase(typename)}JSON`;
                    } else {
                        imports.add('.', `${modname}`);
                    }

                    return {
                        borshType: fragment(borshTypeStr, imports),
                        fromJSON: fragment(fromJSONStr, imports),
                        isEnum: isEnum,
                        pyJSONType: fragment(pyJSONTypeStr, imports),

                        pyType: fragment(pyTypeStr, imports),
                        //looseType: fragment(numberType.format),
                        strictType: fragment(''),
                        toJSON: fragment('{{name}}.to_json()', imports),
                        value: fragment(''),
                    };
                },
                visitFixedSizeType(node) {
                    return {
                        borshType: fragment(`borsh.U8[${node.size}]`),
                        fromJSON: fragment('{{name}}'),
                        isEnum: false,
                        pyJSONType: fragment('list[int]'),
                        pyType: fragment('list[int]'),
                        strictType: fragment('ReadonlyUint8Array').addImports(
                            'solanaCodecsCore',
                            'type ReadonlyUint8Array',
                        ),
                        toJSON: fragment('{{name}}'),
                        value: fragment(''),
                    };
                },
                visitMapEntryValue(node, { self }) {
                    return mergeManifests([visit(node.key, self), visit(node.value, self)], {
                        mergeValues: renders => `[${renders.join(', ')}]`,
                    });
                },

                visitMapValue(node, { self }) {
                    const entryFragments = node.entries.map(entry => visit(entry, self));
                    return mergeManifests(entryFragments, {
                        mergeValues: renders => `new Map([${renders.join(', ')}])`,
                    });
                },
                visitNoneValue() {
                    const manifest = typeManifest();
                    manifest.value.setRender('none()').addImports('solanaOptions', 'none');
                    return manifest;
                },
                visitNumberType(numberType) {
                    //console.log('visitNumberType:', numberType);
                    return {
                        borshType: fragment(NumberToBorshType(numberType.format)),
                        fromJSON: fragment('{{name}}'),
                        isEnum: false,
                        pyJSONType: fragment('int'),

                        pyType: fragment('int'),
                        //looseType: fragment(numberType.format),
                        strictType: fragment(numberType.format),
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
                    const toJSONStr = `(None if {{name}} is None else ${inner.toJSON.render})`;

                    const fromJSONStr = `(None if {{name}} is None else ${inner.fromJSON.render})`;
                    return {
                        borshType: fragment(`borsh.Option(${inner.borshType.render})`, inner.borshType.imports),
                        fromJSON: fragment(fromJSONStr, inner.fromJSON.imports),
                        isEnum: false,
                        pyJSONType: fragment(`typing.Optional[${inner.pyJSONType.render}]`, inner.pyJSONType.imports),
                        pyType: fragment(`typing.Optional[${inner.pyJSONType.render}]`, inner.pyJSONType.imports),
                        strictType: fragment('boolean'),
                        toJSON: fragment(toJSONStr, inner.toJSON.imports),
                        value: fragment(''),
                    };
                },
                visitPublicKeyType() {
                    const imports = new ImportMap().add('solders.pubkey', 'Pubkey');
                    imports.add('anchorpy.borsh_extension', 'BorshPubkey');
                    return {
                        borshType: fragment('BorshPubkey', imports),
                        fromJSON: fragment('Pubkey.from_string({{name}})'),
                        isEnum: false,
                        pyJSONType: fragment('str'),
                        pyType: fragment('Pubkey', imports),
                        strictType: fragment('BorshPubkey', imports),
                        toJSON: fragment('str({{name}})'),
                        value: fragment(''),
                    };
                },

                visitPublicKeyValue(node) {
                    const manifest = typeManifest();
                    manifest.value.setRender(`address("${node.publicKey}")`).addImports('solanaAddresses', 'address');
                    return manifest;
                },

                visitSizePrefixType(_node) {
                    return {
                        borshType: fragment('borsh.String'),
                        fromJSON: fragment('{{name}}'),
                        isEnum: false,
                        pyJSONType: fragment('str'),
                        pyType: fragment('str'),
                        strictType: fragment('ReadonlyUint8Array').addImports(
                            'solanaCodecsCore',
                            'type ReadonlyUint8Array',
                        ),
                        toJSON: fragment('{{name}}'),
                        value: fragment(''),
                    };
                },

                visitStringType(_node) {
                    return {
                        borshType: fragment('borsh.String'),
                        fromJSON: fragment('{{name}}'),
                        isEnum: false,
                        pyJSONType: fragment('str'),
                        pyType: fragment('borsh.String'),
                        strictType: fragment('ReadonlyUint8Array').addImports(
                            'solanaCodecsCore',
                            'type ReadonlyUint8Array',
                        ),
                        toJSON: fragment('{{name}}'),
                        value: fragment(''),
                    };
                },
                visitTupleType(tupleType, { self }) {
                    const imports = new ImportMap().add('solders.pubkey', 'Pubkey');
                    //borsh.CStruct("item_0" / borsh.Bool, "item_1" / borsh.U8),
                    const items = tupleType.items.map(item => visit(item, self));
                    const borshTypestr = items.map((it, index) => `"item_${index}" / ${it.borshType.render}`).join(',');
                    const pyJSONType = items.map(it => `${it.pyJSONType.render}`).join(',');
                    const pyType = items.map(it => `${it.pyType.render}`).join(',');
                    return {
                        borshType: fragment(borshTypestr, imports),
                        fromJSON: fragment('Pubkey.from_string({{name}})'),
                        isEnum: false,
                        pyJSONType: fragment(pyJSONType),
                        pyType: fragment(pyType, imports),
                        strictType: fragment('BorshPubkey', imports),
                        toJSON: fragment('str({{name}})'),
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
