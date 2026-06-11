import type { ProgramLinkNode } from '@codama/node-types';
import { camelCase } from '../../shared';

/** A reference to a program by name. */
export function programLinkNode(name: string): ProgramLinkNode {
    return Object.freeze({
        kind: 'programLinkNode',

        // Data.
        name: camelCase(name),
    });
}
