import { EnumStructVariantTypeNode, EnumTupleVariantTypeNode, EnumVariantTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';

import { getFieldsPy, getFieldsPyJSON, getLayoutFields, PyFragment } from './fragments';
import { GlobalFragmentScope } from './getRenderMapVisitor';
import { ImportMap } from './ImportMap';
import { renderString } from './utils';

export class EnumHelper {
    variants: EnumVariantTypeNode[];
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'>;
    constructor(variants: EnumVariantTypeNode[], scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'>) {
        this.variants = variants;
        this.scope = scope;
    }
    getTuplePyJSON(node: EnumVariantTypeNode): PyFragment {
        const { typeManifestVisitor } = this.scope;
        const tupleType = visit((node as EnumTupleVariantTypeNode).tuple, typeManifestVisitor);
        return new PyFragment([tupleType.pyJSONType.render], tupleType.pyJSONType.imports);
    }
    getTuplePy(node: EnumVariantTypeNode): PyFragment {
        const { typeManifestVisitor } = this.scope;
        const tupleType = visit((node as EnumTupleVariantTypeNode).tuple, typeManifestVisitor);
        return new PyFragment([tupleType.pyType.render], tupleType.pyType.imports);
    }
    getTupleLayout(node: EnumVariantTypeNode): PyFragment {
        const { typeManifestVisitor } = this.scope;
        const tupleType = visit((node as EnumTupleVariantTypeNode).tuple, typeManifestVisitor);
        return new PyFragment([tupleType.borshType.render], tupleType.borshType.imports);
    }
    getTupleToJSON(node: EnumVariantTypeNode): PyFragment {
        const { typeManifestVisitor } = this.scope;
        const tupleType = visit((node as EnumTupleVariantTypeNode).tuple, typeManifestVisitor);
        return new PyFragment([tupleType.toJSON.render], tupleType.toJSON.imports);
    }
    getTupleToEncodable(node: EnumVariantTypeNode): PyFragment {
        const { typeManifestVisitor } = this.scope;
        const tupleType = visit((node as EnumTupleVariantTypeNode).tuple, typeManifestVisitor);
        return new PyFragment([tupleType.toEncode.render]);
    }
    getTupleFromJSON(node: EnumVariantTypeNode): PyFragment {
        const { typeManifestVisitor } = this.scope;
        const tupleType = visit((node as EnumTupleVariantTypeNode).tuple, typeManifestVisitor);
        const fromCast = renderString(tupleType.fromJSON.render, { name: `${node.name}JSONValue` });
        return new PyFragment([fromCast], tupleType.fromJSON.imports);
    }
    getTupleDecode(node: EnumVariantTypeNode): PyFragment {
        const { typeManifestVisitor } = this.scope;
        const tupleType = visit((node as EnumTupleVariantTypeNode).tuple, typeManifestVisitor);
        const fromCast = renderString(tupleType.fromDecode.render, { name: 'val' });
        return new PyFragment([fromCast], tupleType.fromDecode.imports);
    }

    getStructPyJSON(node: EnumStructVariantTypeNode): PyFragment {
        let fields;
        if (node.struct.kind == 'sizePrefixTypeNode') {
            if (node.struct.type.kind == 'structTypeNode') {
                fields = node.struct.type.fields;
            }
        }
        if (node.struct.kind == 'structTypeNode') {
            //const fields = node.struct.fields;
            fields = node.struct.fields;
        }
        if (fields) {
            return getFieldsPyJSON({
                ...this.scope,
                fields,
            })!;
        }
        return new PyFragment(['']);
    }
    getStructPy(node: EnumStructVariantTypeNode): PyFragment {
        let fields;
        if (node.struct.kind == 'sizePrefixTypeNode') {
            if (node.struct.type.kind == 'structTypeNode') {
                fields = node.struct.type.fields;
            }
        }
        if (node.struct.kind == 'structTypeNode') {
            //const fields = node.struct.fields;
            fields = node.struct.fields;
        }
        if (fields) {
            return getFieldsPy({
                ...this.scope,
                fields,
            })!;
        }
        return new PyFragment(['']);
    }
    getStructToJSON(node: EnumStructVariantTypeNode): PyFragment {
        let fields;
        const { typeManifestVisitor } = this.scope;
        if (node.struct.kind == 'sizePrefixTypeNode') {
            if (node.struct.type.kind == 'structTypeNode') {
                fields = node.struct.type.fields;
            }
        }
        if (node.struct.kind == 'structTypeNode') {
            //const fields = node.struct.fields;
            fields = node.struct.fields;
        }
        if (fields) {
            const render = fields
                .map(it => {
                    const itemType = visit(it.type, typeManifestVisitor);
                    const fromCast = renderString(itemType.toJSON.render, { name: `self.value["${it.name}"]` });
                    return `"${it.name}":${fromCast}`;
                })
                .join(',');
            return new PyFragment([render]);
        }

        return new PyFragment(['']);
    }
    getStructToEncodable(node: EnumStructVariantTypeNode): PyFragment {
        const { typeManifestVisitor } = this.scope;
        let fields;
        if (node.struct.kind == 'sizePrefixTypeNode') {
            if (node.struct.type.kind == 'structTypeNode') {
                fields = node.struct.type.fields;
            }
        }
        if (node.struct.kind == 'structTypeNode') {
            //const fields = node.struct.fields;
            fields = node.struct.fields;
        }
        if (fields) {
            const render = fields
                .map(it => {
                    const itemType = visit(it.type, typeManifestVisitor);
                    let innerStr = '';
                    if (itemType.isEncodable) {
                        innerStr = renderString(itemType.toEncode.render, {
                            name: `self.value["${it.name}"].to_encodable()`,
                        });
                    } else {
                        innerStr = renderString(itemType.toEncode.render, { name: `self.value["${it.name}"]` });
                    }

                    return `"${it.name}":${innerStr}`;
                })
                .join(',');
            return new PyFragment([render]);
        }
        return new PyFragment(['']);
    }
    getStructFromJSON(node: EnumStructVariantTypeNode): PyFragment {
        const { typeManifestVisitor } = this.scope;
        let fields;
        if (node.struct.kind == 'sizePrefixTypeNode') {
            if (node.struct.type.kind == 'structTypeNode') {
                fields = node.struct.type.fields;
            }
        }
        if (node.struct.kind == 'structTypeNode') {
            //const fields = node.struct.fields;
            fields = node.struct.fields;
        }
        if (fields) {
            const render = fields
                .map(it => {
                    const itemType = visit(it.type, typeManifestVisitor);
                    const fromCast = renderString(itemType.fromJSON.render, {
                        name: `${node.name}JSONValue["${it.name}"]`,
                    });
                    return `${it.name}=${fromCast}`;
                })
                .join(',');
            return new PyFragment([render]);
        }
        return new PyFragment(['']);
    }

    getStructLayout(node: EnumStructVariantTypeNode): PyFragment {
        let fields;
        if (node.struct.kind == 'sizePrefixTypeNode') {
            if (node.struct.type.kind == 'structTypeNode') {
                fields = node.struct.type.fields;
            }
        }
        if (node.struct.kind == 'structTypeNode') {
            //const fields = node.struct.fields;
            fields = node.struct.fields;
        }
        if (fields) {
            return getLayoutFields({
                ...this.scope,
                fields,
                prefix: '',
            });
        }
        return new PyFragment(['']);
    }
    getStructLayoutType(node: EnumStructVariantTypeNode): PyFragment {
        let fields;
        let isPrefixType = false;
        let fieldRenders;
        const imports = new ImportMap();
        if (node.struct.kind == 'sizePrefixTypeNode') {
            isPrefixType = true;
            if (node.struct.type.kind == 'structTypeNode') {
                fields = node.struct.type.fields;
            }
        } else if (node.struct.kind == 'structTypeNode') {
            //const fields = node.struct.fields;
            fields = node.struct.fields;
            isPrefixType = false;
        }
        if (fields) {
            fieldRenders = getLayoutFields({
                ...this.scope,
                fields,
                prefix: '',
            });
            if (isPrefixType) {
                imports.add('..shared', 'SizePrefix');
                const renderStr = `SizePrefix(borsh.U16,borsh.CStruct(${fieldRenders.renders.join(',')}))`;
                return new PyFragment([renderStr], imports);
            } else {
                const renderStr = `borsh.CStruct(${fieldRenders.renders.join(',')})`;
                return new PyFragment([renderStr]);
            }
        }
        return new PyFragment(['']);
    }
    getStructDecode(node: EnumStructVariantTypeNode): PyFragment {
        const { typeManifestVisitor } = this.scope;
        let fields;
        if (node.struct.kind == 'sizePrefixTypeNode') {
            if (node.struct.type.kind == 'structTypeNode') {
                fields = node.struct.type.fields;
            }
        }
        if (node.struct.kind == 'structTypeNode') {
            //const fields = node.struct.fields;
            fields = node.struct.fields;
        }
        if (fields) {
            const render = fields
                .map(it => {
                    const itemType = visit(it.type, typeManifestVisitor);
                    const fromCast = renderString(itemType.fromDecode.render, { name: `val["${it.name}"]` });
                    return `${it.name}= ${fromCast}`;
                })
                .join(',');
            return new PyFragment([render]);
        }
        return new PyFragment(['']);
    }
    genAllImports(): ImportMap {
        const imports = new ImportMap();
        this.variants.map(item => {
            if (item.kind == 'enumTupleVariantTypeNode') {
                let itemtype = this.getTuplePyJSON(item);
                imports.mergeWith(itemtype);
                itemtype = this.getTuplePy(item);
                imports.mergeWith(itemtype);
                itemtype = this.getTupleLayout(item);
                imports.mergeWith(itemtype);
            } else if (item.kind == 'enumStructVariantTypeNode') {
                let itemtype = this.getStructPyJSON(item);
                imports.mergeWith(itemtype);
                itemtype = this.getStructLayout(item);
                imports.mergeWith(itemtype);
                itemtype = this.getStructLayoutType(item);
                imports.mergeWith(itemtype);
            }
        });
        return imports;
    }
}
