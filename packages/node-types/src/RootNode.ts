import type { ProgramNode } from './ProgramNode';
import type { KinobiVersion } from './shared';

export interface RootNode<
    TProgram extends ProgramNode = ProgramNode,
    TAdditionalPrograms extends ProgramNode[] = ProgramNode[],
> {
    readonly kind: 'rootNode';

    // Data.
    readonly standard: 'codama';
    readonly version: KinobiVersion;

    // Children.
    readonly program: TProgram;
    readonly additionalPrograms: TAdditionalPrograms;
}
