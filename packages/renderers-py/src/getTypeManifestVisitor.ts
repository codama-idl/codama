import { REGISTERED_TYPE_NODE_KINDS, REGISTERED_VALUE_NODE_KINDS,
        // CountNode,
    isNode } from '@codama/nodes';
import {
    extendVisitor,
    LinkableDictionary,
    NodeStack,
    pipe,
    recordNodeStackVisitor,
    staticVisitor,
    visit,
} from '@codama/visitors-core';
import { pascalCase } from '@codama/nodes';


import { fragment } from './fragments';
import { ImportMap } from './ImportMap';
import { mergeManifests, TypeManifest, typeManifest } from './TypeManifest';
import { GetImportFromFunction,renderString } from './utils';

export type TypeManifestVisitor = ReturnType<typeof getTypeManifestVisitor>;

export function HexToPyB(hexStr:string) {
    const buffer: Buffer = Buffer.from(hexStr, 'hex');
    const xFormat: string = Array.from(buffer)
        .map(byte => `\\x${byte.toString(16).padStart(2, '0')}`)
        .join('');
    return xFormat;
}

export function getTypeManifestVisitor(input: {
    getImportFrom: GetImportFromFunction;
    linkables: LinkableDictionary;
    parentName?: string | null;
    stack?: NodeStack;
}) {
    //const { customAccountData } = input;
    const stack = input.stack ?? new NodeStack();
    //let parentName: { loose: string; strict: string } | null = null;

    return pipe(
        staticVisitor(
            () =>
                ({
                    borshType: fragment(''),
                    isEnum: false,
                    pyType: fragment(''),
                    strictType: fragment(''),
                    value: fragment(''),
                    toJSON: fragment(''),
                    fromJSON:fragment('{{name}}'),
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
                    const inner = visit(arrayType.item,self);
                    //console.log("visitArrayType:",arrayType,self);
                    let count = 0;
                    if (isNode(arrayType.count, 'fixedCountNode')) {
                        count = arrayType.count.value;
                    }
                    let toJSONItemStr = renderString(inner.toJSON.render,{name:"item"})
                    let toJSONStr = `list(map(lambda item:${toJSONItemStr},{{name}}))`
                    let fromJSONItemStr = renderString(inner.fromJSON.render,{name:"item"})
                    let fromJSONStr = `list(map(lambda item:${fromJSONItemStr},{{name}}))`
                    return {
                        borshType: fragment(`${itemlayout.borshType}[${count}]`),
                        isEnum: false,
                        pyJSONType:fragment(`list[${inner.pyJSONType}]`),
                        pyType: fragment(`list[${inner.pyType}]`),
                        strictType: fragment('boolean'),
                        value: fragment(''),
                        toJSON:fragment(toJSONStr),
                        fromJSON:fragment(fromJSONStr)
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
                        borshType: fragment('borsh.U8'),
                        isEnum: false,
                        pyJSONType: fragment('bool'),
                        pyType: fragment('bool'),
                        strictType: fragment('boolean'),
                        value: fragment(''),
                        toJSON:fragment('{{name}}'),
                        fromJSON:fragment('{{name}}')
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
                        isEnum: false,
                        pyJSONType: fragment("list[int]"),
                        pyType: fragment('borsh.Bytes'),
                        strictType: fragment('ReadonlyUint8Array').addImports(
                            'solanaCodecsCore',
                            'type ReadonlyUint8Array',
                        ),
                        value: fragment(''),
                        toJSON:fragment('{{name}}'),
                        fromJSON:fragment('{{name}}')
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
                    //console.log("type link",node);
                    const typename = node.name;
                    const modname = node.name;
                    const imports = new ImportMap().add('..', 'types');
                    let pyJSONTypeStr =`types.${modname}.${pascalCase(typename)}JSON`;
                    let pyTypeStr =`types.${modname}.${pascalCase(typename)}`;
                    let borshTypeStr =`types.${modname}.${pascalCase(typename)}.layout`;
                    let fromJSONStr = `types.${modname}.${pascalCase(typename)}.from_json({{name}})`
                    //types.amm_curve.AmmCurve.from_json(obj["curve"]),

                    return {
                        borshType: fragment(borshTypeStr,imports),
                        isEnum: false,
                        pyJSONType:fragment(pyJSONTypeStr,imports),
                        pyType: fragment(pyTypeStr,imports),
                        //looseType: fragment(numberType.format),
                        strictType: fragment(""),
                        value: fragment(''),
                        toJSON:fragment("{{name}}.to_json()"),
                        fromJSON:fragment(fromJSONStr)

                    }
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
                        isEnum: false,
                        pyJSONType:fragment('int'),
                        pyType: fragment('int'),
                        //looseType: fragment(numberType.format),
                        strictType: fragment(numberType.format),
                        value: fragment(''),
                        toJSON:fragment("{{name}}"),
                        fromJSON:fragment('{{name}}')
                    };
                },

                visitNumberValue(node) {
                    const manifest = typeManifest();
                    manifest.value.setRender(JSON.stringify(node.number));
                    return manifest;
                },

                visitPublicKeyType() {
                    const imports = new ImportMap().add('solders.pubkey', 'Pubkey');
                    return {
                        borshType: fragment('BorshPubkey', imports),
                        isEnum: false,
                        pyType: fragment('Pubkey', imports),
                        pyJSONType: fragment('str'),
                        strictType: fragment('BorshPubkey', imports),
                        value: fragment(''),
                        toJSON:fragment("str({{name}})"),
                        fromJSON:fragment('Pubkey.from_string({{name}})')
                    };
                },

                visitPublicKeyValue(node) {
                    const manifest = typeManifest();
                    manifest.value.setRender(`address("${node.publicKey}")`).addImports('solanaAddresses', 'address');
                    return manifest;
                },
            }),
        visitor => recordNodeStackVisitor(visitor, stack),
    );
}

function NumberToBorshType(format: string) {
    return 'borsh.' + format.toUpperCase();
}
