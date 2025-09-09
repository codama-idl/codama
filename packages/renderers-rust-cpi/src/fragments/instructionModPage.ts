import { InstructionNode } from '@codama/nodes';

import { addFragmentImports, Fragment, fragment, getPageFragment, mergeFragments, RenderScope } from '../utils';
import { getModImportsFragment } from './modPage';

/**
 * Get the mod page fragment for instructions.
 */
export function getInstructionModPageFragment(
    scope: Pick<RenderScope, 'dependencyMap'> & { instructions: InstructionNode[] },
): Fragment | undefined {
    const imports = getModImportsFragment(scope.instructions);
    if (!imports) return;

    return getPageFragment(
        mergeFragments([imports, getInstructionHelpersFragment()], cs => cs.join('\n\n')),
        scope,
    );
}

/**
 * Helpers for handling `MaybeUninit<u8>` buffers.
 */
function getInstructionHelpersFragment(): Fragment {
    return addFragmentImports(
        fragment`
        const UNINIT_BYTE: MaybeUninit<u8> = MaybeUninit::<u8>::uninit();
    
        /// Write bytes from a source slice to a destination slice of \`MaybeUninit<u8>\`.
        #[inline(always)]
        fn write_bytes(destination: &mut [MaybeUninit<u8>], source: &[u8]) {
            for (d, s) in destination.iter_mut().zip(source.iter()) {
                d.write(*s);
            }
        }`,
        ['core::mem::MaybeUninit'],
    );
}
