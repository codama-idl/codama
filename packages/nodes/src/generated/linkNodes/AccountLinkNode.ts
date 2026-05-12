import type { AccountLinkNode, ProgramLinkNode } from '@codama/node-types';
import { camelCase } from '../../shared';
import { programLinkNode } from './ProgramLinkNode';

/** A reference to an account defined elsewhere — possibly in a different program. */
export function accountLinkNode<const TProgram extends ProgramLinkNode | undefined = undefined>(
    name: string,
    program?: TProgram | string,
): AccountLinkNode<TProgram> {
    return Object.freeze({
        kind: 'accountLinkNode',

        // Data.
        name: camelCase(name),

        // Children.
        ...(program !== undefined && {
            program: (typeof program === 'string' ? programLinkNode(program) : program) as TProgram,
        }),
    });
}
