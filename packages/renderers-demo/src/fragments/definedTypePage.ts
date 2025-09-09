import { DefinedTypeNode, titleCase } from '@codama/nodes';
import { visit } from '@codama/visitors-core';

import {
    Fragment,
    fragment,
    getCodeBlockFragment,
    getFrontmatterFragment,
    getPageFragment,
    getTitleAndDescriptionFragment,
} from '../utils';
import { TypeVisitor } from '../visitors/getTypeVisitor';

export function getDefinedTypePageFragment(node: DefinedTypeNode, typeVisitor: TypeVisitor): Fragment {
    const title = titleCase(node.name);
    const type = visit(node, typeVisitor);

    return getPageFragment(
        [
            getFrontmatterFragment(title, `Overview of the ${title} type`),
            getTitleAndDescriptionFragment(title, node.docs),
            fragment`## Type definition`,
            getCodeBlockFragment(type, 'ts'),
        ],
        // Generated types are within the same directory.
        { generatedTypes: '.' },
    );
}
