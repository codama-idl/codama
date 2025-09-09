import { AccountNode, PdaNode, titleCase } from '@codama/nodes';
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
import { getPdaFunctionUsageFragment } from './pdaFunctionUsage';

export function getAccountPageFragment(
    node: AccountNode,
    typeVisitor: TypeVisitor,
    size?: number,
    pda?: PdaNode,
): Fragment {
    const title = titleCase(node.name);
    const type = visit(node, typeVisitor);

    return getPageFragment(
        [
            getFrontmatterFragment(title, `Overview of the ${title} account`),
            getTitleAndDescriptionFragment(title, node.docs),
            fragment`## Account data`,
            getCodeBlockFragment(type, 'ts'),
            ...(size ? [fragment`This account has a fixed size of ${size} bytes.`] : []),
            ...(pda ? [fragment`## PDA`, getCodeBlockFragment(getPdaFunctionUsageFragment(pda), 'ts')] : []),
        ],
        // Generated accounts are within the same directory.
        { generatedAccounts: '.' },
    );
}
