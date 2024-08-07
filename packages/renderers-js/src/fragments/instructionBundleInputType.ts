import {
   InstructionBundleNode,
} from '@kinobi-so/nodes';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { Fragment, fragmentFromTemplate } from './common';

export function getInstructionBundleInputTypeFragment(
    scope: Partial<GlobalFragmentScope> & {
        instructionBundleNode: InstructionBundleNode;
    },
): Fragment {
    const { instructionBundleNode } = scope;

    return fragmentFromTemplate('instructionBundleInputType.njk', {
        instructionBundle: instructionBundleNode,
    })
        //.addImports('solanaAddresses', ['type Address', 'getProgramDerivedAddress', 'type ProgramDerivedAddress']);
}
