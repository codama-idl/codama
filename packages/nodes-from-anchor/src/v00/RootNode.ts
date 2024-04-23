import { RootNode, rootNode } from '@kinobi-so/nodes';

import { IdlV00 } from './idl';
import { programNodeFromAnchorV00 } from './ProgramNode';

export function rootNodeFromAnchorV00(program: IdlV00, additionalPrograms: IdlV00[] = []): RootNode {
    const programNode = programNodeFromAnchorV00(program);
    const additionalProgramNodes = additionalPrograms.map(programNodeFromAnchorV00);
    return rootNode(programNode, additionalProgramNodes);
}
