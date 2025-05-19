import { InstructionArgumentNode, StructFieldTypeNode } from '@codama/nodes';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { PyFragment} from './common';
import { visit } from '@codama/visitors-core';
export function getLayoutFields(
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        fields: InstructionArgumentNode[] | StructFieldTypeNode[];
        prefix: string;
    },
): PyFragment {
    const { fields, typeManifestVisitor } = scope;
    const fragments: string[] = [];
    fields.forEach((field, _index) => {
        if (field.name == 'discriminator') {
            return;
        }
        const fieldtype = visit(field.type, typeManifestVisitor);
        fragments.push(`"${field.name}" /${fieldtype.borshType.render}`);
    });
    return new PyFragment(fragments);
}
