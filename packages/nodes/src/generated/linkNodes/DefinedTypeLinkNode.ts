import type { DefinedTypeLinkNode, ProgramLinkNode } from '@codama/node-types';
import { camelCase } from '../../shared';
import { programLinkNode } from './ProgramLinkNode';

/** A reference to a defined type — possibly in a different program. */
export function definedTypeLinkNode<const TProgram extends ProgramLinkNode | undefined = undefined>(
    name: string,
    program?: TProgram | string,
): DefinedTypeLinkNode<TProgram> {
    return Object.freeze({
        kind: 'definedTypeLinkNode',

        // Data.
        name: camelCase(name),

        // Children.
        ...(program !== undefined && {
            program: (typeof program === 'string' ? programLinkNode(program) : program) as TProgram,
        }),
    });
}
