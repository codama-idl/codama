import { EnumStructVariantTypeNode, EnumTupleVariantTypeNode, EnumVariantTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';

import { getFieldsPy, getLayoutFields, PyFragment } from './fragments';
import { GlobalFragmentScope } from './getRenderMapVisitor';
import { ImportMap } from './ImportMap';

export class EnumHelper {
    //name: String
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
        //node.kind ==
        const tupleType = visit((node as EnumTupleVariantTypeNode).tuple, typeManifestVisitor);
        return new PyFragment([tupleType.borshType.render], tupleType.borshType.imports);
    }
    getStructPyJSON(node: EnumStructVariantTypeNode): PyFragment {
        if (node.struct.kind == 'structTypeNode') {
            //node.struct.fields.map()
            const fields = node.struct.fields;
            return getFieldsPy({
                ...this.scope,
                fields,
            })!;
        }
        return new PyFragment(['']);
    }
    getStructLayout(node: EnumStructVariantTypeNode): PyFragment {
        if (node.struct.kind == 'structTypeNode') {
            const fields = node.struct.fields;
            return getLayoutFields({
                ...this.scope,
                fields,
                prefix: '',
            });
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
            }
        });
        return imports;
    }
}
