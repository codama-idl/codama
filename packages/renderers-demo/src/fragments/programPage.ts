import { camelCase, ProgramNode, titleCase } from '@codama/nodes';
import { joinPath } from '@codama/renderers-core';

import {
    Fragment,
    fragment,
    getFrontmatterFragment,
    getPageFragment,
    getTitleAndDescriptionFragment,
    mergeFragments,
} from '../utils';
import { getProgramErrorsFragment } from './programErrors';

export function getProgramPageFragment(node: ProgramNode): Fragment {
    const title = `${titleCase(node.name)} Program`;
    const errors = getProgramErrorsFragment(node.errors);

    return getPageFragment(
        [
            getFrontmatterFragment(title, `Overview of the ${title}`),
            getTitleAndDescriptionFragment(title, node.docs),
            fragment`## Information`,
            fragment`- Address: \`${node.publicKey}\`\n- Version: \`${node.version}\``,
            fragment`## Accounts`,
            getLinksFragment(node.accounts, 'accounts'),
            fragment`## Instructions`,
            getLinksFragment(node.instructions, 'instructions'),
            fragment`## PDAs`,
            getLinksFragment(node.pdas, 'pdas', 'PDAs'),
            fragment`## Defined types`,
            getLinksFragment(node.definedTypes, 'definedTypes', 'defined types'),
            fragment`## Errors`,
            errors ? errors : fragment`_This program has no errors._`,
        ],
        // Generated items are nested in sibling directories.
        {
            generatedAccounts: 'accounts',
            generatedInstructions: 'instructions',
            generatedPdas: 'pdas',
            generatedTypes: 'types',
        },
    );
}

function getLinksFragment(items: { name: string }[], folder: string, identifier?: string): Fragment {
    if (items.length === 0) return fragment`_This program has no ${identifier ?? folder}._`;
    const links = items.map(item => {
        const link = joinPath(folder, `${camelCase(item.name)}.md`);
        return fragment`- [${titleCase(item.name)}](${link})`;
    });
    return mergeFragments(links, cs => cs.join('\n'));
}
