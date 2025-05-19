import { REGISTERED_TYPE_NODE_KINDS, REGISTERED_VALUE_NODE_KINDS } from '@codama/nodes';
import {
    extendVisitor,
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
import { GetImportFromFunction } from './utils';

export type TypeManifestVisitor = ReturnType<typeof getTypeManifestVisitor>;

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
                    fromJSON:fragment('obj[\"{{name}}\"]'),
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
                    const cast_layout = `typing.cast(Construct, ${itemlayout.borshType.render})`;
                    const inner = visit(arrayType.item,self);

                    return {
                        borshType: fragment(`borsh.Vec(${cast_layout})`),
                        isEnum: false,
                        pyJSONType:fragment(`list[${inner.pyJSONType}]`),
                        pyType: fragment('bool'),
                        strictType: fragment('boolean'),
                        value: fragment(''),
                        toJSON:fragment("self.{{name}}"),
                        fromJSON:fragment('obj[\"{{name}}\"]')
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
                        toJSON:fragment(''),
                        fromJSON:fragment('obj.[\"{{name}}\"]')
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
                        toJSON:fragment('self.{{name}}'),
                        fromJSON:fragment('obj.[\"{{name}}\"]')
                    };
                },

                visitBytesValue(node) {
                    const manifest = typeManifest();
                    manifest.value.setRender(`b"${node.data}"`);
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
                    console.log('visitNumberType:', numberType);
                    return {
                        borshType: fragment(NumberToBorshType(numberType.format)),
                        isEnum: false,
                        pyJSONType:fragment('int'),
                        pyType: fragment('int'),
                        //looseType: fragment(numberType.format),
                        strictType: fragment(numberType.format),
                        value: fragment(''),
                        toJSON:fragment("self.{{name}}"),
                        fromJSON:fragment('obj[\"{{name}}\"]')
                    };
                },

                visitNumberValue(node) {
                    const manifest = typeManifest();
                    manifest.value.setRender(JSON.stringify(node.number));
                    return manifest;
                },

                visitPublicKeyType() {
                    const imports = new ImportMap().add('solana.publickey', 'Pubkey');
                    return {
                        borshType: fragment('BorshPubkey', imports),
                        isEnum: false,
                        pyType: fragment('Pubkey', imports),
                        pyJSONType: fragment('str'),
                        strictType: fragment('BorshPubkey', imports),
                        value: fragment(''),
                        toJSON:fragment("str(self.{{name}})"),
                        fromJSON:fragment('Pubkey.from_string(obj[\"{{name}}\"])')
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
