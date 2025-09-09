import { PdaNode, titleCase } from '@codama/nodes';

import { Fragment, fragment, getFrontmatterFragment, getPageFragment, getTitleAndDescriptionFragment } from '../utils';
import { TypeVisitor } from '../visitors/getTypeVisitor';
import { ValueVisitor } from '../visitors/getValueVisitor';
import { getPdaSeedsFragment } from './pdaSeeds';

export function getPdaPageFragment(node: PdaNode, typeVisitor: TypeVisitor, valueVisitor: ValueVisitor): Fragment {
    const title = `${titleCase(node.name)} PDA`;
    const seeds = getPdaSeedsFragment(node.seeds, typeVisitor, valueVisitor);

    return getPageFragment(
        [
            getFrontmatterFragment(title, `Overview of the ${title}`),
            getTitleAndDescriptionFragment(title, node.docs),
            fragment`## Seeds`,
            seeds ? seeds : fragment`_This PDA has no seeds._`,
        ],
        // Generated PDAs are within the same directory.
        { generatedPdas: '.' },
    );
}
