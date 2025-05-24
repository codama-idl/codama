import { InstructionArgumentNode, StructFieldTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { ImportMap } from '../ImportMap';
import { PyFragment } from './common';

export function getLayoutFields(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
        prefix: string;
    },
): PyFragment {
    const { fields, typeManifestVisitor } = scope;
    const fragments: string[] = [];
    const imports = new ImportMap();
    fields.forEach((field, _index) => {
        if (field.name == 'discriminator') {
            return;
        }
        const fieldtype = visit(field.type, typeManifestVisitor);
        imports.mergeWith(fieldtype.borshType.imports);
        fragments.push(`"${field.name}" /${fieldtype.borshType.render}`);
    });
    return new PyFragment(fragments, imports);
}
