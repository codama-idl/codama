import {InstructionArgumentNode,StructFieldTypeNode} from '@codama/nodes';
import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { visit } from '@codama/visitors-core';
import { PyFragment } from './common';
import {renderString} from '../utils/render'
import {ImportMap} from '../ImportMap';

export function getFieldsJSON(scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[]
 }): PyFragment| null {

    const { fields,typeManifestVisitor}= scope;
    const fragments: string[] = [];
    const imports =  new ImportMap();

     fields.forEach((field,_index) => {
         if (field.name == 'discriminator') {
             return;
         }
         const fieldtype = visit(field.type, typeManifestVisitor);
         imports.mergeWith(fieldtype.pyJSONType.imports);
         fragments.push(`${field.name}: ${fieldtype.pyJSONType}`);
                   });
     return new PyFragment(fragments,imports);
 }

export function getFieldsPy(scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[]
 }): PyFragment| null {

    const { fields,typeManifestVisitor}= scope;
    const fragments: string[] = [];
     fields.forEach((field,_index) => {
         if (field.name == 'discriminator') {
             return;
         }
         const fieldtype = visit(field.type, typeManifestVisitor);
         fragments.push(`${field.name}: ${fieldtype.pyType}`);
                   });
     return new PyFragment(fragments);
 }
export function getFieldsToJSON(scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[]
 }): PyFragment| null {
     const { fields,typeManifestVisitor}= scope;
    const fragments: string[] = [];
    const imports =  new ImportMap();
     fields.forEach((field,_index) => {
         if (field.name == 'discriminator') {
             return;
         }
         const fieldtype = visit(field.type, typeManifestVisitor);
         imports.mergeWith(fieldtype.toJSON.imports);
         const toCast = renderString(fieldtype.toJSON.render, { name:"self."+field.name })
         fragments.push(`"${field.name}": ${toCast}`);
                   });
     return new PyFragment(fragments,imports);

}
export function getFieldsFromJSON(scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[]
 }): PyFragment| null {
     const { fields,typeManifestVisitor}= scope;
    const fragments: string[] = [];
     fields.forEach((field,_index) => {
         if (field.name == 'discriminator') {
             return;
         }
         const fieldtype = visit(field.type, typeManifestVisitor);
         const fromCast = renderString(fieldtype.fromJSON.render, { name:"obj[\""+field.name+"\"]" })
         fragments.push(`${field.name}=${fromCast}`);
    });
     return new PyFragment(fragments);

}
export function getArgsToLayout(scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[]
 }): PyFragment| null {
     const { fields}= scope;
    const fragments: string[] = [];
     fields.forEach((field,_index) => {
         if (field.name == 'discriminator') {
             return;
         }
               fragments.push(`"${field.name}":args["${field.name}"]`);
                   });
     return new PyFragment(fragments);

}
export function getArgsToPy(scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[]
 }): PyFragment| null {
     const { fields,typeManifestVisitor}= scope;
    const fragments: string[] = [];
     fields.forEach((field,_index) => {
         if (field.name == 'discriminator') {
             return;
         }
         const fieldtype = visit(field.type, typeManifestVisitor);

         fragments.push(`${field.name}:${fieldtype.pyType}`);
                   });
     return new PyFragment(fragments);

}
