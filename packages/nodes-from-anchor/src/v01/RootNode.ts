import { RootNode, rootNode } from '@codama/nodes';

import { IdlV01 } from './idl';
import { programNodeFromAnchorV01 } from './ProgramNode';

export function rootNodeFromAnchorV01(program: IdlV01, additionalPrograms: IdlV01[] = []): RootNode {
    const programNode = programNodeFromAnchorV01(program);
    const additionalProgramNodes = additionalPrograms.map(programNodeFromAnchorV01);
    return rootNode(programNode, additionalProgramNodes);
}
