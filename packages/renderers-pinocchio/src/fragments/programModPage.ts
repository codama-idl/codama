import { ProgramNode, snakeCase } from '@codama/nodes';
import { pipe } from '@codama/visitors-core';

import { addFragmentImports, Fragment, fragment, getPageFragment, mergeFragments, RenderScope } from '../utils';

export function getProgramModPageFragment(
    scope: Pick<RenderScope, 'dependencyMap'> & { programsToExport: ProgramNode[] },
): Fragment | undefined {
    const programsToExport = scope.programsToExport;
    if (programsToExport.length === 0) return;

    const programAddresses = programsToExport.map(getProgramAddressFragment);
    return getPageFragment(
        mergeFragments(programAddresses, cs => cs.join('\n')),
        scope,
    );
}

function getProgramAddressFragment(program: ProgramNode): Fragment {
    const name = snakeCase(program.name);
    return mergeFragments(
        [
            fragment`/// \`${name}\` program ID.`,
            pipe(fragment`pub const ${name.toUpperCase()}_ID: Pubkey = pubkey!("${program.publicKey}");`, f =>
                addFragmentImports(f, ['pinocchio::pubkey::Pubkey', 'pinocchio_pubkey::pubkey']),
            ),
        ],
        cs => cs.join('\n'),
    );
}
