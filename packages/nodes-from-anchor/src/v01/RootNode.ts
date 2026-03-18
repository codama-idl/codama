import { RootNode, rootNode } from '@codama/nodes';

import { IdlV01 } from './idl';
import { programNodeFromAnchorV01, type ProgramNodeFromAnchorV01Options } from './ProgramNode';

export type RootNodeFromAnchorV01Options = ProgramNodeFromAnchorV01Options;

export function rootNodeFromAnchorV01(
    program: IdlV01,
    additionalPrograms: IdlV01[] = [],
    options: RootNodeFromAnchorV01Options = {},
): RootNode {
    const programNode = programNodeFromAnchorV01(program, options);
    const additionalProgramNodes = additionalPrograms.map(p => programNodeFromAnchorV01(p, options));
    return rootNode(programNode, additionalProgramNodes);
}
