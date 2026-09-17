import type { InstructionLinkNode, PluginNode, ProgramLinkNode } from '@codama/node-types';

import { identifierString } from '../../shared';
import { programLinkNode } from './ProgramLinkNode';

/** A reference to an instruction defined elsewhere — possibly in a different program. */
export function instructionLinkNode<
    const TProgram extends ProgramLinkNode | undefined = undefined,
    const TPlugins extends Array<PluginNode> | undefined = undefined,
>(
    identifier: string,
    options: {
        program?: TProgram;
        plugins?: TPlugins;
    } = {},
): InstructionLinkNode<TProgram, TPlugins> {
    const program = options.program;
    return Object.freeze({
        kind: 'instructionLinkNode',

        // Data.
        identifier: identifierString(identifier),

        // Children.
        ...(program !== undefined && {
            program: (typeof program === 'string' ? programLinkNode(program) : program) as TProgram,
        }),
        ...(options.plugins !== undefined && options.plugins.length > 0 && { plugins: options.plugins as TPlugins }),
    });
}
