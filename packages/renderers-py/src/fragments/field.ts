import { InstructionArgumentNode, StructFieldTypeNode } from '@codama/nodes';
import { pascalCase } from '@codama/nodes';
import { visit } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { ImportMap } from '../ImportMap';
import { renderString } from '../utils/render';
import { PyFragment } from './common';
import {notPyKeyCase} from '../utils'

export function getFieldsJSON(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fields, typeManifestVisitor } = scope;
    const fragments: string[] = [];
    const imports = new ImportMap();

    fields.forEach((field, _index) => {
        if (field.name == 'discriminator') {
            return;
        }
        //console.log('field.name', field.name, field.type);
        const fieldtype = visit(field.type, typeManifestVisitor);
        if (fieldtype.pyJSONType.imports) {
            imports.mergeWith(fieldtype.pyJSONType.imports);
        } else {
            //console.log('field.name', field.name, field.type);
        }
        fragments.push(`${notPyKeyCase(field.name)}: ${fieldtype.pyJSONType.render}`);
    });
    return new PyFragment(fragments, imports);
}

export function getFieldsPy(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fields, typeManifestVisitor } = scope;
    const fragments: string[] = [];
    fields.forEach((field, _index) => {
        if (field.name == 'discriminator') {
            return;
        }
        const fieldtype = visit(field.type, typeManifestVisitor);
        fragments.push(`${notPyKeyCase(field.name)}: ${fieldtype.pyType.render}`);
    });
    return new PyFragment(fragments);
}
export function getFieldsPyJSON(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fields, typeManifestVisitor } = scope;
    const fragments: string[] = [];
    fields.forEach((field, _index) => {
        if (field.name == 'discriminator') {
            return;
        }
        const fieldtype = visit(field.type, typeManifestVisitor);
        fragments.push(`${field.name}: ${fieldtype.pyJSONType.render}`);
    });
    return new PyFragment(fragments);
}
export function getFieldsToJSON(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fields, typeManifestVisitor } = scope;
    const fragments: string[] = [];
    const imports = new ImportMap();
    fields.forEach((field, _index) => {
        if (field.name == 'discriminator') {
            return;
        }
        const fieldtype = visit(field.type, typeManifestVisitor);
        imports.mergeWith(fieldtype.toJSON.imports);
        const toCast = renderString(fieldtype.toJSON.render, { name: 'self.' + notPyKeyCase(field.name) });
        fragments.push(`"${notPyKeyCase(field.name)}": ${toCast}`);
    });
    return new PyFragment(fragments, imports);
}

export function getFieldsToJSONEncodable(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fields } = scope;
    const fragments: string[] = [];
    const imports = new ImportMap();
    fields.forEach((field, _index) => {
        if (field.name == 'discriminator') {
            return;
        }
        if (field.type.kind == 'definedTypeLinkNode') {
            const toCast = renderString('{{name}}.to_encodable()', { name: 'self.' + field.name });
            fragments.push(`"${field.name}": ${toCast}`);
        } else {
            fragments.push(`"${field.name}": self.${notPyKeyCase(field.name)}`);
        }
        //const fieldtype = visit(field.type, typeManifestVisitor);
        //imports.mergeWith(fieldtype.toJSON.imports);
        //const toCast = renderString(fieldtype.toJSON.render, { name: 'self.' + field.name });
        //fieldtype.
        //fragments.push(`"${field.name}": self.${toCast}`);
    });
    return new PyFragment(fragments, imports);
}

export function getFieldsDecode(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fields, typeManifestVisitor } = scope;
    const fragments: string[] = [];
    const imports = new ImportMap();
    fields.forEach((field, _index) => {
        if (field.name == 'discriminator') {
            return;
        }
        if (field.type.kind == 'definedTypeLinkNode') {
            const fieldtype = visit(field.type, typeManifestVisitor);
            imports.mergeWith(fieldtype.toJSON.imports);
            if (fieldtype.isEnum) {
                fragments.push(`${field.name}=types.${field.type.name}.from_decoded(dec.${field.name})`);
            } else {
                fragments.push(
                    `${field.name}=types.${field.type.name}.${pascalCase(field.type.name)}.from_decoded(dec.${field.name})`,
                );
            }
        } else {
            fragments.push(`${field.name}=dec.${field.name}`);
        }
    });
    return new PyFragment(fragments, imports);
}

export function getFieldsFromJSON(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fields, typeManifestVisitor } = scope;
    const fragments: string[] = [];
    const imports = new ImportMap();
    fields.forEach((field, _index) => {
        if (field.name == 'discriminator') {
            return;
        }
        const fieldtype = visit(field.type, typeManifestVisitor);
        imports.mergeWith(fieldtype.fromJSON);
        const fromCast = renderString(fieldtype.fromJSON.render, { name: 'obj["' + notPyKeyCase(field.name) + '"]' });
        fragments.push(`${notPyKeyCase(field.name)}=${fromCast}`);
    });
    return new PyFragment(fragments, imports);
}
export function getFieldsFromDecode(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fields, typeManifestVisitor } = scope;
    const fragments: string[] = [];
    const imports = new ImportMap();
    fields.forEach((field, _index) => {
        if (field.name == 'discriminator') {
            return;
        }
        const fieldtype = visit(field.type, typeManifestVisitor);
        imports.mergeWith(fieldtype.fromDecode);
        const fromCast = renderString(fieldtype.fromDecode.render, { name: 'obj["' + field.name + '"]' });
        fragments.push(`${notPyKeyCase(field.name)}=${fromCast}`);
    });
    return new PyFragment(fragments, imports);
}

export function getArgsToLayout(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fields } = scope;
    const fragments: string[] = [];
    fields.forEach((field, _index) => {
        if (field.name == 'discriminator') {
            return;
        }
        fragments.push(`"${field.name}":args["${field.name}"]`);
    });
    return new PyFragment(fragments);
}
export function getArgsToPy(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
    },
): PyFragment | null {
    const { fields, typeManifestVisitor } = scope;
    const fragments: string[] = [];
    const imports = new ImportMap();
    fields.forEach((field, _index) => {
        if (field.name == 'discriminator') {
            return;
        }
        const fieldtype = visit(field.type, typeManifestVisitor);
        imports.mergeWith(fieldtype.pyType);
        fragments.push(`${field.name}:${fieldtype.pyType.render}`);
    });
    return new PyFragment(fragments);
}
// export function getTupleItems(scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
//     fields: TypeNode[]
// }): PyFragment | null {
//     //const { fields, typeManifestVisitor } = scope;
//     const fragments: string[] = [];
//     //const imports = new ImportMap();
//     // fields.forEach((field, _index) => {
//     //     const fieldtype = visit(field.type, typeManifestVisitor);
//     // //     imports.mergeWith(fieldtype.pyType);
//     //     fragments.push(`${fieldtype.pyType}`);
//     // );
//     return new PyFragment(fragments);
// }
